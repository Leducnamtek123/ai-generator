import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VisualCharacterEntity } from '../entities/visual-character.entity';

/**
 * Prompt builder service — enhances image/video prompts with context.
 * Ported from FlowKit operations.py:
 * - Veo 3 audio instructions (music/voice control)
 * - Negative prompt injection (no watermarks, subtitles, etc.)
 * - Character voice descriptions for dialogue scenes
 * - Continuation scene transformation prompts
 */
@Injectable()
export class PromptBuilderService {
  private readonly logger = new Logger(PromptBuilderService.name);

  constructor(
    @InjectRepository(VisualCharacterEntity)
    private readonly characterRepo: Repository<VisualCharacterEntity>,
  ) {}

  // ─── Dialogue detection ─────────────────────────

  private static readonly DIALOGUE_VERBS = [
    'says', 'whispers', 'shouts', 'asks', 'replies',
    'murmurs', 'exclaims', 'gasps', 'laughs', 'mutters',
    'speaks', 'calls', 'yells', 'talks', 'announces',
  ];

  private hasDialogue(prompt: string): boolean {
    const lower = prompt.toLowerCase();
    return PromptBuilderService.DIALOGUE_VERBS.some((v) => lower.includes(v));
  }

  // ─── Composition guidelines (per entity type) ───

  private static readonly COMPOSITION_GUIDELINES: Record<string, string> = {
    character:
      'COMPOSITION: Full body shot from head to toe, standing upright and straight. ' +
      'Centered in frame with balanced composition. Front-facing view, looking directly at camera. ' +
      'Neutral simple background. Proper proportions and anatomy. Character perfectly vertical.',
    location:
      'COMPOSITION: Establishing shot showing the full environment. ' +
      'Balanced level composition with straight horizon. Clear focal point. ' +
      'Atmospheric and richly detailed. Show depth and spatial layout.',
    creature:
      'COMPOSITION: Full body shot showing the creature\'s complete form. ' +
      'Emphasize natural stance (quadrupedal, bipedal, etc.). ' +
      'Centered with clear view of distinctive features. Neutral background.',
    visual_asset:
      'COMPOSITION: Clear detailed view showing the asset\'s complete form. ' +
      'Appropriate angle to showcase distinctive features and functional elements. ' +
      'Centered with proper scale reference. Neutral background. Show key details and textures.',
  };

  /**
   * Get composition guideline for a specific entity type.
   * Used when generating reference images for characters/locations/etc.
   */
  getCompositionGuideline(entityType: string): string {
    return (
      PromptBuilderService.COMPOSITION_GUIDELINES[entityType] ||
      PromptBuilderService.COMPOSITION_GUIDELINES['character']
    );
  }

  /**
   * Build a complete reference image prompt with material style + composition.
   */
  buildReferenceImagePrompt(
    entityName: string,
    description: string | undefined,
    options: {
      entityType?: string;
      materialPrefix?: string;
      materialNegative?: string;
      lighting?: string;
      story?: string;
    } = {},
  ): string {
    const entityType = options.entityType || 'character';
    const baseDesc = description || entityName;
    const composition = this.getCompositionGuideline(entityType);

    const prefix = options.story
      ? `Single reference image of ${baseDesc}. `
      : `Reference image of ${baseDesc}. `;
    const singleNote = options.story
      ? 'ONE single image only, NOT a multi-panel grid or multiple views. '
      : '';
    const style = options.materialPrefix || '';
    const negative = options.materialNegative ? ` ${options.materialNegative}` : '';
    const lighting = options.lighting || 'Studio lighting, highly detailed';

    return `${prefix}${style}${negative} ${composition} ${singleNote}${lighting}`.trim();
  }

  // ─── Continuation prompt builder ────────────────

  /**
   * Build a transformation-focused prompt for CONTINUATION scenes.
   * When editing from a parent image, the edit API preserves the parent's
   * composition — this prepends transformation instructions.
   */
  buildContinuationPrompt(basePrompt: string): string {
    return (
      `Transform this image into a completely different moment. ` +
      `Move the camera to a new angle, position, and composition. ` +
      `Change the surrounding environment and visual setup. ` +
      basePrompt
    );
  }

  // ─── Video prompt enrichment ────────────────────

  /**
   * Enhance a video prompt with:
   * 1. Character voice descriptions (if scene has dialogue)
   * 2. Audio control labels (Veo 3 format)
   * 3. Negative prompt (no subtitles, watermarks, etc.)
   */
  async buildVideoPrompt(
    basePrompt: string,
    options: {
      projectId?: string;
      characterNames?: string[];
      allowMusic?: boolean;
      allowVoice?: boolean;
      skipNegative?: boolean;
    } = {},
  ): Promise<string> {
    const parts = [basePrompt.trim()];
    const promptLower = basePrompt.toLowerCase();

    // 1. Append character voice context for dialogue scenes
    if (
      options.projectId &&
      options.characterNames?.length &&
      this.hasDialogue(basePrompt)
    ) {
      const characters = await this.characterRepo.find({
        where: { projectId: options.projectId },
      });

      const namesSet = new Set(options.characterNames);
      const voiceDescriptions: string[] = [];

      for (const char of characters) {
        if (!namesSet.has(char.name)) continue;
        const voiceDesc = (char as any).voiceDescription;
        if (voiceDesc) {
          voiceDescriptions.push(`${char.name}: ${voiceDesc}`);
        }
      }

      if (voiceDescriptions.length) {
        parts.push('Character voices: ' + voiceDescriptions.join('. ') + '.');
      }
    }

    // 2. Audio control (Veo 3 format)
    if (!options.allowMusic) {
      if (
        !promptLower.includes('audio:') &&
        !promptLower.includes('music:')
      ) {
        if (options.allowVoice) {
          parts.push(
            'Audio: no background music. Keep character dialogue and natural ambient sounds.',
          );
        } else {
          parts.push(
            'Audio: natural ambient sounds only, no background music, no narration, no voiceover.',
          );
        }
      }
    }

    // 3. Negative prompt
    if (!options.skipNegative && !promptLower.includes('negative:')) {
      parts.push(
        'Negative: subtitles, captions, watermark, text on screen, logo, blurry faces, distorted hands.',
      );
    }

    return parts.join(' ');
  }

  // ─── Image prompt enrichment ────────────────────

  /**
   * Build an enhanced image prompt with character reference context.
   */
  async buildImagePrompt(
    basePrompt: string,
    options: {
      projectId?: string;
      characterNames?: string[];
      isContinuation?: boolean;
    } = {},
  ): Promise<string> {
    let prompt = basePrompt;

    // Wrap continuation scenes
    if (options.isContinuation) {
      prompt = this.buildContinuationPrompt(prompt);
    }

    return prompt;
  }

  // ─── Batch prompt enrichment ────────────────────

  /**
   * Enrich prompts for all scenes in a video — useful before batch generation.
   */
  async enrichScenePrompts(
    scenes: Array<{
      id: string;
      prompt: string;
      videoPrompt?: string;
      characterNames?: string[];
      chainType?: string;
    }>,
    options: {
      projectId?: string;
      allowMusic?: boolean;
      allowVoice?: boolean;
    } = {},
  ): Promise<
    Array<{
      sceneId: string;
      imagePrompt: string;
      videoPrompt: string;
    }>
  > {
    const results: Array<{ sceneId: string; imagePrompt: string; videoPrompt: string }> = [];

    for (const scene of scenes) {
      const isContinuation = scene.chainType === 'CONTINUATION';
      const imagePrompt = await this.buildImagePrompt(scene.prompt, {
        projectId: options.projectId,
        characterNames: scene.characterNames,
        isContinuation,
      });

      const videoPrompt = await this.buildVideoPrompt(
        scene.videoPrompt || scene.prompt,
        {
          projectId: options.projectId,
          characterNames: scene.characterNames,
          allowMusic: options.allowMusic,
          allowVoice: options.allowVoice,
        },
      );

      results.push({
        sceneId: scene.id,
        imagePrompt,
        videoPrompt,
      });
    }

    this.logger.log(`Enriched prompts for ${results.length} scenes`);
    return results;
  }
}
