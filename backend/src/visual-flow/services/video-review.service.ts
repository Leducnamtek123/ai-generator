import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';

const execFileAsync = promisify(execFile);

/**
 * Video review engine — frame extraction + Claude Vision analysis.
 * Ported from FlowKit: extracts frames, analyzes quality via Claude Vision
 * across 6 dimensions with structured error detection.
 */

export interface DimensionScores {
  characterConsistency: number;
  promptAdherence: number;
  motionQuality: number;
  visualFidelity: number;
  temporalCoherence: number;
  composition: number;
}

export interface VideoError {
  severity: 'CRITICAL' | 'HIGH' | 'MINOR';
  timeRange: string;
  description: string;
}

export interface UsableSegment {
  timeRange: string;
  score: number;
}

export interface SceneReviewResult {
  sceneId: string;
  overallScore: number;
  verdict: string;
  dimensions: DimensionScores;
  errors: VideoError[];
  usableSegments: UsableSegment[];
  fixGuide: string;
  framesAnalyzed: number;
  fpsUsed: number;
  hasCriticalErrors: boolean;
}

export interface VideoReviewResult {
  videoId: string;
  overallScore: number;
  verdict: string;
  sceneReviews: SceneReviewResult[];
  scenesReviewed: number;
  scenesSkipped: number;
  mode: string;
}

// Scoring weights
const WEIGHTS: Record<string, number> = {
  characterConsistency: 0.25,
  promptAdherence: 0.2,
  motionQuality: 0.2,
  visualFidelity: 0.15,
  temporalCoherence: 0.1,
  composition: 0.1,
};

const REVIEW_FPS_LIGHT = 4;
const REVIEW_FPS_DEEP = 8;
const REVIEW_MAX_FRAMES = 24;

@Injectable()
export class VideoReviewService {
  private readonly logger = new Logger(VideoReviewService.name);
  private readonly anthropicKey: string;
  private readonly reviewModel: string;

  constructor(private readonly configService: ConfigService) {
    this.anthropicKey =
      this.configService.get<string>('ANTHROPIC_API_KEY') ||
      this.configService.get<string>('providers.anthropicKey') ||
      '';
    this.reviewModel = 'claude-sonnet-4-20250514';
  }

  // ─── Scoring helpers ───────────────────────────────

  private computeOverall(dims: DimensionScores): number {
    const d: Record<string, number> = dims as any;
    let total = 0;
    for (const [key, weight] of Object.entries(WEIGHTS)) {
      total += (d[key] ?? 5) * weight;
    }
    return Math.round(total * 100) / 100;
  }

  private verdict(score: number): string {
    if (score >= 9) return 'excellent';
    if (score >= 7.5) return 'good';
    if (score >= 6) return 'acceptable';
    if (score >= 4) return 'poor';
    return 'unusable';
  }

  private fixGuide(dims: DimensionScores, errors: VideoError[]): string {
    const criticalTypes = new Set<string>();
    for (const err of errors) {
      const desc = err.description.toLowerCase();
      if (err.severity === 'CRITICAL') {
        if (/drift|morph|limb|breed/.test(desc)) criticalTypes.add('drift');
        if (/swap|wrong character/.test(desc)) criticalTypes.add('breed_swap');
        if (/count|number of character/.test(desc)) criticalTypes.add('count');
        if (/logo|brand/.test(desc)) criticalTypes.add('logo');
        if (/role|wrong action/.test(desc)) criticalTypes.add('role');
      } else if (err.severity === 'HIGH') {
        if (/reverse/.test(desc)) criticalTypes.add('reverse');
      }
    }

    if (criticalTypes.size > 0) {
      const hints: string[] = [];
      if (criticalTypes.has('drift'))
        hints.push("simplify prompt, add 'steady camera, minimal movement'");
      if (criticalTypes.has('breed_swap'))
        hints.push('use stronger color contrast between characters');
      if (criticalTypes.has('count'))
        hints.push('make ONE character dominant, others in background');
      if (criticalTypes.has('logo'))
        hints.push("add 'no brand logos, no text' to prompt");
      if (criticalTypes.has('role'))
        hints.push('rewrite prompt to clarify character actions');
      if (criticalTypes.has('reverse'))
        hints.push('regenerate video (reverse motion is random)');
      return 'REGENERATE: ' + hints.join('; ');
    }

    const d: Record<string, number> = dims as any;
    const lowest = Object.entries(d).sort((a, b) => a[1] - b[1])[0]?.[0];
    const guides: Record<string, string> = {
      characterConsistency: 'Check character references, use closer framing',
      promptAdherence: 'Rewrite scene prompt to be more specific',
      motionQuality: 'Regenerate video (motion artifacts are random)',
      visualFidelity: 'Consider upscaling or better lighting',
      temporalCoherence: 'Regenerate, check lighting consistency',
      composition: 'Edit camera directions in prompt',
    };
    return guides[lowest] || 'Review and regenerate';
  }

  // ─── Frame extraction ──────────────────────────────

  private async extractFrames(
    videoPath: string,
    fps: number,
    outDir: string,
  ): Promise<string[]> {
    await execFileAsync('ffmpeg', [
      '-y',
      '-i',
      videoPath,
      '-vf',
      `fps=${fps},scale=640:-1`,
      '-q:v',
      '4',
      `${outDir}/frame_%04d.jpg`,
    ]);
    const files = fs
      .readdirSync(outDir)
      .filter((f) => f.startsWith('frame_'))
      .sort()
      .map((f) => path.join(outDir, f));
    return files;
  }

  // ─── Claude Vision Analysis ────────────────────────

  private buildVisionPrompt(
    nFrames: number,
    fps: number,
    prompt: string,
    context: string,
  ): string {
    return `You are an expert AI video quality reviewer analyzing ${nFrames} frames at ${fps}fps from an AI-generated video.

SCENE PROMPT: ${prompt}
EXPECTED CONTEXT: ${context || 'none specified'}

SCORING DIMENSIONS (0.0-10.0 each):
1. characterConsistency - Characters match references? Stable features?
2. promptAdherence - Video matches prompt? Correct characters, actions?
3. motionQuality - Smooth motion? No jitter/reverse?
4. visualFidelity - Clear resolution? No artifacts/blur?
5. temporalCoherence - Consistent lighting/shadows across frames?
6. composition - Good framing, depth, balance?

ERROR DETECTION (classify by severity):
CRITICAL: Character Drift, Character Swap, Brand Logo
HIGH: Camera Drift, Object Morph, Reverse Motion, Scale Break
MINOR: Prop Count, Clothing Detail, Background Blur

Return ONLY valid JSON:
{
  "dimensions": {"characterConsistency": N, "promptAdherence": N, "motionQuality": N, "visualFidelity": N, "temporalCoherence": N, "composition": N},
  "errors": [{"severity": "CRITICAL|HIGH|MINOR", "timeRange": "Xs-Ys", "description": "what happened"}],
  "usableSegments": [{"timeRange": "Xs-Ys", "score": N}]
}`;
  }

  private parseJsonResponse(raw: string): any {
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.split('```')[1];
      if (cleaned.startsWith('json')) cleaned = cleaned.slice(4);
    }
    cleaned = cleaned.trim();
    if (!cleaned.startsWith('{')) {
      const start = cleaned.indexOf('{');
      if (start >= 0) cleaned = cleaned.slice(start);
    }
    return JSON.parse(cleaned);
  }

  // ─── Public API ────────────────────────────────────

  async reviewVideoFile(
    videoPath: string,
    options: {
      prompt?: string;
      context?: string;
      mode?: 'light' | 'deep';
      sceneId?: string;
    } = {},
  ): Promise<SceneReviewResult> {
    if (!this.anthropicKey) {
      throw new BadRequestException(
        'ANTHROPIC_API_KEY not configured — video review requires Claude Vision',
      );
    }
    if (!fs.existsSync(videoPath)) {
      throw new BadRequestException(`Video file not found: ${videoPath}`);
    }

    const fps =
      options.mode === 'deep' ? REVIEW_FPS_DEEP : REVIEW_FPS_LIGHT;
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vreview-'));

    try {
      // Extract frames
      this.logger.log(`Extracting frames at ${fps}fps`);
      let frames = await this.extractFrames(videoPath, fps, tmpDir);
      if (!frames.length) {
        throw new BadRequestException('No frames extracted from video');
      }

      // Limit frames
      if (frames.length > REVIEW_MAX_FRAMES) {
        const step = frames.length / REVIEW_MAX_FRAMES;
        frames = Array.from(
          { length: REVIEW_MAX_FRAMES },
          (_, i) => frames[Math.floor(i * step)],
        );
      }

      const nFrames = frames.length;
      this.logger.log(`Analyzing ${nFrames} frames via Claude Vision`);

      // Build content for Claude (raw API — no SDK needed)
      const content: any[] = [];
      for (const framePath of frames) {
        const imgData = fs.readFileSync(framePath).toString('base64');
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: imgData },
        });
      }
      content.push({
        type: 'text',
        text: this.buildVisionPrompt(
          nFrames,
          fps,
          options.prompt || '',
          options.context || '',
        ),
      });

      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: this.reviewModel,
          max_tokens: 1024,
          messages: [{ role: 'user', content }],
        },
        {
          headers: {
            'x-api-key': this.anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          timeout: 120_000,
        },
      );

      const result = this.parseJsonResponse(
        response.data.content[0]?.text ?? '{}',
      );

      // Parse errors
      const errors: VideoError[] = (result.errors || [])
        .filter(
          (e: any) => e?.severity && e?.timeRange && e?.description,
        )
        .map((e: any) => ({
          severity: e.severity.toUpperCase(),
          timeRange: e.timeRange,
          description: e.description,
        }));

      const hasCritical = errors.some((e) => e.severity === 'CRITICAL');
      const dimsRaw = result.dimensions || {};

      const dims: DimensionScores = {
        characterConsistency: hasCritical
          ? Math.min(parseFloat(dimsRaw.characterConsistency ?? 5), 3)
          : parseFloat(dimsRaw.characterConsistency ?? 5),
        promptAdherence: parseFloat(dimsRaw.promptAdherence ?? 5),
        motionQuality: parseFloat(dimsRaw.motionQuality ?? 5),
        visualFidelity: parseFloat(dimsRaw.visualFidelity ?? 5),
        temporalCoherence: parseFloat(dimsRaw.temporalCoherence ?? 5),
        composition: parseFloat(dimsRaw.composition ?? 5),
      };

      let overall = this.computeOverall(dims);
      if (hasCritical && overall > 5.9) overall = 5.9;

      const usableSegments: UsableSegment[] = (
        result.usableSegments || []
      )
        .filter((s: any) => s?.timeRange && s?.score != null)
        .map((s: any) => ({
          timeRange: s.timeRange,
          score: parseFloat(s.score),
        }));

      return {
        sceneId: options.sceneId || path.basename(videoPath, '.mp4'),
        overallScore: overall,
        verdict: this.verdict(overall),
        dimensions: dims,
        errors,
        usableSegments,
        fixGuide: this.fixGuide(dims, errors),
        framesAnalyzed: nFrames,
        fpsUsed: fps,
        hasCriticalErrors: hasCritical,
      };
    } finally {
      // Cleanup temp
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }

  async reviewMultipleVideos(
    videoPaths: string[],
    options: {
      prompts?: string[];
      mode?: 'light' | 'deep';
      videoId?: string;
    } = {},
  ): Promise<VideoReviewResult> {
    const reviews: SceneReviewResult[] = [];
    let skipped = 0;

    for (let i = 0; i < videoPaths.length; i++) {
      try {
        const review = await this.reviewVideoFile(videoPaths[i], {
          prompt: options.prompts?.[i],
          mode: options.mode,
          sceneId: `scene_${i}`,
        });
        reviews.push(review);
      } catch (err: any) {
        this.logger.error(`Failed to review ${videoPaths[i]}: ${err.message}`);
        skipped++;
      }
    }

    const overall = reviews.length
      ? Math.round(
          (reviews.reduce((s, r) => s + r.overallScore, 0) / reviews.length) *
            100,
        ) / 100
      : 0;

    return {
      videoId: options.videoId || 'batch',
      overallScore: overall,
      verdict: this.verdict(overall),
      sceneReviews: reviews,
      scenesReviewed: reviews.length,
      scenesSkipped: skipped,
      mode: options.mode || 'light',
    };
  }
}
