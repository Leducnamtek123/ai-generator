import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execFileAsync = promisify(execFile);

/**
 * Post-processing pipeline: trim, merge, overlay narration/music via ffmpeg.
 * Ported from FlowKit: provides video post-processing utilities.
 */
@Injectable()
export class PostProcessService {
  private readonly logger = new Logger(PostProcessService.name);

  // ─── Helpers ────────────────────────────────────

  private clamp(value: number, name: string, lo = 0, hi = 2): number {
    if (value < lo || value > hi) {
      this.logger.warn(
        `Parameter ${name}=${value} out of bounds [${lo}, ${hi}], clamping`,
      );
      return Math.max(lo, Math.min(hi, value));
    }
    return value;
  }

  private ensureDir(filePath: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async getVideoDuration(videoPath: string): Promise<number> {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v',
      'quiet',
      '-show_entries',
      'format=duration',
      '-of',
      'csv=p=0',
      videoPath,
    ]);
    const duration = parseFloat(stdout.trim());
    if (isNaN(duration)) {
      throw new BadRequestException(
        `Could not determine duration of ${videoPath}`,
      );
    }
    return duration;
  }

  // ─── Trim ────────────────────────────────────────

  async trimVideo(
    inputPath: string,
    outputPath: string,
    start: number,
    end: number,
  ): Promise<string> {
    if (!fs.existsSync(inputPath)) {
      throw new BadRequestException(`Input file not found: ${inputPath}`);
    }
    const duration = end - start;
    if (duration <= 0) {
      throw new BadRequestException(`Invalid range [${start}, ${end}]`);
    }
    this.ensureDir(outputPath);

    await execFileAsync('ffmpeg', [
      '-y',
      '-i',
      inputPath,
      '-ss',
      String(start),
      '-t',
      String(duration),
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '18',
      '-force_key_frames',
      'expr:gte(t,0)',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      outputPath,
    ]);

    this.logger.log(
      `Trimmed ${inputPath} → ${outputPath} [${start}-${end}]`,
    );
    return outputPath;
  }

  // ─── Merge / Concatenate ─────────────────────────

  async mergeVideos(
    videoPaths: string[],
    outputPath: string,
  ): Promise<string> {
    if (!videoPaths.length) {
      throw new BadRequestException('No video paths provided');
    }
    for (const p of videoPaths) {
      if (!fs.existsSync(p)) {
        throw new BadRequestException(`File not found: ${p}`);
      }
    }
    this.ensureDir(outputPath);

    const concatFile = outputPath + '.concat.txt';
    try {
      const concatContent = videoPaths
        .map((p) => `file '${p.replace(/'/g, "'\\''")}'`)
        .join('\n');
      fs.writeFileSync(concatFile, concatContent);

      await execFileAsync('ffmpeg', [
        '-y',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        concatFile,
        '-c:v',
        'copy',
        '-c:a',
        'copy',
        '-movflags',
        '+faststart',
        outputPath,
      ]);
    } finally {
      if (fs.existsSync(concatFile)) fs.unlinkSync(concatFile);
    }

    this.logger.log(
      `Merged ${videoPaths.length} videos → ${outputPath}`,
    );
    return outputPath;
  }

  // ─── Normalize ───────────────────────────────────

  async normalizeVideo(
    inputPath: string,
    outputPath: string,
    options: { fps?: number; width?: number; height?: number } = {},
  ): Promise<string> {
    const { fps = 25, width = 1080, height = 1920 } = options;
    if (!fs.existsSync(inputPath)) {
      throw new BadRequestException(`Input not found: ${inputPath}`);
    }
    this.ensureDir(outputPath);

    await execFileAsync('ffmpeg', [
      '-y',
      '-i',
      inputPath,
      '-vf',
      `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,fps=${fps}`,
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '18',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-ar',
      '44100',
      '-ac',
      '2',
      '-movflags',
      '+faststart',
      outputPath,
    ]);

    this.logger.log(
      `Normalized ${inputPath} → ${outputPath} (${width}x${height}@${fps}fps)`,
    );
    return outputPath;
  }

  // ─── Add Narration ───────────────────────────────

  async addNarration(
    videoPath: string,
    narrationPath: string,
    outputPath: string,
    options: {
      narrationVolume?: number;
      sfxVolume?: number;
      fadeIn?: number;
      fadeOut?: number;
    } = {},
  ): Promise<string> {
    if (!fs.existsSync(videoPath))
      throw new BadRequestException(`Video not found: ${videoPath}`);
    if (!fs.existsSync(narrationPath))
      throw new BadRequestException(`Narration not found: ${narrationPath}`);

    const nv = this.clamp(options.narrationVolume ?? 1.0, 'narrationVolume');
    const sv = this.clamp(options.sfxVolume ?? 0.4, 'sfxVolume');
    const fi = this.clamp(options.fadeIn ?? 0.5, 'fadeIn');
    const fo = this.clamp(options.fadeOut ?? 0.5, 'fadeOut');

    const duration = await this.getVideoDuration(videoPath);
    const fadeStart = Math.max(0, duration - fo);
    this.ensureDir(outputPath);

    await execFileAsync('ffmpeg', [
      '-y',
      '-i',
      videoPath,
      '-i',
      narrationPath,
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-filter_complex',
      `[0:a]volume=${sv}[sfx];[1:a]volume=${nv},afade=t=in:st=0:d=${fi},afade=t=out:st=${fadeStart}:d=${fo}[narr];[sfx][narr]amerge=inputs=2,pan=stereo|c0=c0+c2|c1=c1+c3[aout]`,
      '-map',
      '0:v',
      '-map',
      '[aout]',
      '-shortest',
      '-movflags',
      '+faststart',
      outputPath,
    ]);

    this.logger.log(`Narration added → ${outputPath}`);
    return outputPath;
  }

  // ─── Add Music ───────────────────────────────────

  async addMusic(
    videoPath: string,
    musicPath: string,
    outputPath: string,
    options: {
      musicVolume?: number;
      fadeIn?: number;
      fadeOut?: number;
    } = {},
  ): Promise<string> {
    if (!fs.existsSync(videoPath))
      throw new BadRequestException(`Video not found: ${videoPath}`);
    if (!fs.existsSync(musicPath))
      throw new BadRequestException(`Music not found: ${musicPath}`);

    const mv = this.clamp(options.musicVolume ?? 0.3, 'musicVolume');
    const fi = this.clamp(options.fadeIn ?? 2.0, 'fadeIn');
    const fo = this.clamp(options.fadeOut ?? 3.0, 'fadeOut');

    const duration = await this.getVideoDuration(videoPath);
    const fadeStart = Math.max(0, duration - fo);
    this.ensureDir(outputPath);

    await execFileAsync('ffmpeg', [
      '-y',
      '-i',
      videoPath,
      '-i',
      musicPath,
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-filter_complex',
      `[0:a]volume=1.0[orig];[1:a]volume=${mv},afade=t=in:st=0:d=${fi},afade=t=out:st=${fadeStart}:d=${fo}[music];[orig][music]amerge=inputs=2,pan=stereo|c0=c0+c2|c1=c1+c3[aout]`,
      '-map',
      '0:v',
      '-map',
      '[aout]',
      '-shortest',
      '-movflags',
      '+faststart',
      outputPath,
    ]);

    this.logger.log(`Music added → ${outputPath}`);
    return outputPath;
  }

  // ─── Extract Audio ───────────────────────────────

  async extractAudio(
    videoPath: string,
    outputPath: string,
  ): Promise<string> {
    if (!fs.existsSync(videoPath))
      throw new BadRequestException(`File not found: ${videoPath}`);
    this.ensureDir(outputPath);

    await execFileAsync('ffmpeg', [
      '-y',
      '-i',
      videoPath,
      '-vn',
      '-acodec',
      'pcm_s16le',
      '-ar',
      '44100',
      '-ac',
      '2',
      outputPath,
    ]);
    return outputPath;
  }

  // ─── Create Contact Sheet ────────────────────────

  async createContactSheet(
    videoPath: string,
    outputPath: string,
    options: { fps?: number; cols?: number } = {},
  ): Promise<{ path: string; frameCount: number }> {
    const { fps = 4, cols = 8 } = options;
    if (!fs.existsSync(videoPath))
      throw new BadRequestException(`File not found: ${videoPath}`);

    const duration = await this.getVideoDuration(videoPath);
    const totalFrames = Math.floor(duration * fps);
    const rows = Math.ceil(totalFrames / cols);
    this.ensureDir(outputPath);

    await execFileAsync('ffmpeg', [
      '-y',
      '-i',
      videoPath,
      '-vf',
      `fps=${fps},scale=320:-1,drawtext=text='%{pts\\:hms}':x=5:y=5:fontsize=14:fontcolor=white:borderw=1:bordercolor=black,tile=${cols}x${rows}`,
      '-q:v',
      '2',
      outputPath,
    ]);

    this.logger.log(
      `Contact sheet: ${outputPath} (${totalFrames} frames)`,
    );
    return { path: outputPath, frameCount: totalFrames };
  }

  // ─── Image → Video (Ken Burns zoom) ─────────────

  /**
   * Convert a single image into a video clip with subtle Ken Burns zoom effect.
   * No AI credits needed — pure ffmpeg.
   */
  async imageToVideo(
    imagePath: string,
    outputPath: string,
    options: {
      duration?: number;
      fps?: number;
      width?: number;
      height?: number;
      zoomDirection?: 'in' | 'out' | 'pan_left' | 'pan_right';
    } = {},
  ): Promise<string> {
    const {
      duration = 5,
      fps = 25,
      width = 1080,
      height = 1920,
      zoomDirection = 'in',
    } = options;

    if (!fs.existsSync(imagePath)) {
      throw new BadRequestException(`Image not found: ${imagePath}`);
    }
    this.ensureDir(outputPath);

    // Build zoompan filter based on direction
    const totalFrames = duration * fps;
    let zoompanFilter: string;

    switch (zoomDirection) {
      case 'out':
        // Zoom out: start zoomed 1.3x, pull back to 1.0x
        zoompanFilter = `zoompan=z='1.3-0.3*on/${totalFrames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${totalFrames}:s=${width}x${height}:fps=${fps}`;
        break;
      case 'pan_left':
        // Pan left to right
        zoompanFilter = `zoompan=z='1.15':x='(iw-iw/zoom)*on/${totalFrames}':y='ih/2-(ih/zoom/2)':d=${totalFrames}:s=${width}x${height}:fps=${fps}`;
        break;
      case 'pan_right':
        // Pan right to left
        zoompanFilter = `zoompan=z='1.15':x='(iw-iw/zoom)*(1-on/${totalFrames})':y='ih/2-(ih/zoom/2)':d=${totalFrames}:s=${width}x${height}:fps=${fps}`;
        break;
      case 'in':
      default:
        // Zoom in: start at 1.0x, zoom to 1.3x
        zoompanFilter = `zoompan=z='1+0.3*on/${totalFrames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${totalFrames}:s=${width}x${height}:fps=${fps}`;
        break;
    }

    await execFileAsync('ffmpeg', [
      '-y',
      '-loop', '1',
      '-i', imagePath,
      '-vf', zoompanFilter,
      '-t', String(duration),
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      outputPath,
    ]);

    this.logger.log(
      `Image → Video (${zoomDirection}): ${imagePath} → ${outputPath} (${duration}s)`,
    );
    return outputPath;
  }

  // ─── Images → Slideshow (crossfade transitions) ──

  /**
   * Create a slideshow video from multiple images with crossfade transitions.
   * Each image is displayed for `durationPerSlide` seconds with `transitionDuration` crossfade.
   */
  async imagesToSlideshow(
    imagePaths: string[],
    outputPath: string,
    options: {
      durationPerSlide?: number;
      transitionDuration?: number;
      fps?: number;
      width?: number;
      height?: number;
      zoomEffect?: boolean;
    } = {},
  ): Promise<{ path: string; totalDuration: number; slideCount: number }> {
    const {
      durationPerSlide = 4,
      transitionDuration = 1,
      fps = 25,
      width = 1080,
      height = 1920,
      zoomEffect = true,
    } = options;

    if (!imagePaths.length) {
      throw new BadRequestException('No images provided for slideshow');
    }
    for (const p of imagePaths) {
      if (!fs.existsSync(p)) {
        throw new BadRequestException(`Image not found: ${p}`);
      }
    }
    this.ensureDir(outputPath);

    // For a single image, just use imageToVideo
    if (imagePaths.length === 1) {
      await this.imageToVideo(imagePaths[0], outputPath, {
        duration: durationPerSlide,
        fps,
        width,
        height,
      });
      return { path: outputPath, totalDuration: durationPerSlide, slideCount: 1 };
    }

    // Build complex filter for multi-image slideshow with xfade transitions
    const slideDurationFrames = durationPerSlide * fps;
    const inputs = imagePaths.flatMap((p) => ['-loop', '1', '-t', String(durationPerSlide), '-i', p]);

    const filterParts: string[] = [];
    const n = imagePaths.length;

    // Scale + zoompan each input
    for (let i = 0; i < n; i++) {
      if (zoomEffect) {
        const zoomTypes = ['in', 'out', 'pan_left', 'pan_right'] as const;
        const zoom = zoomTypes[i % zoomTypes.length];
        let zp: string;
        switch (zoom) {
          case 'out':
            zp = `zoompan=z='1.2-0.2*on/${slideDurationFrames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${slideDurationFrames}:s=${width}x${height}:fps=${fps}`;
            break;
          case 'pan_left':
            zp = `zoompan=z='1.1':x='(iw-iw/zoom)*on/${slideDurationFrames}':y='ih/2-(ih/zoom/2)':d=${slideDurationFrames}:s=${width}x${height}:fps=${fps}`;
            break;
          case 'pan_right':
            zp = `zoompan=z='1.1':x='(iw-iw/zoom)*(1-on/${slideDurationFrames})':y='ih/2-(ih/zoom/2)':d=${slideDurationFrames}:s=${width}x${height}:fps=${fps}`;
            break;
          case 'in':
          default:
            zp = `zoompan=z='1+0.2*on/${slideDurationFrames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${slideDurationFrames}:s=${width}x${height}:fps=${fps}`;
            break;
        }
        filterParts.push(`[${i}:v]${zp},format=yuv420p[v${i}]`);
      } else {
        filterParts.push(
          `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps},format=yuv420p[v${i}]`,
        );
      }
    }

    // Chain xfade transitions between consecutive clips
    let currentLabel = 'v0';
    for (let i = 1; i < n; i++) {
      const offset = i * durationPerSlide - i * transitionDuration;
      const outLabel = i < n - 1 ? `xf${i}` : 'vout';
      filterParts.push(
        `[${currentLabel}][v${i}]xfade=transition=fade:duration=${transitionDuration}:offset=${offset}[${outLabel}]`,
      );
      currentLabel = outLabel;
    }

    const filterComplex = filterParts.join(';');
    const totalDuration =
      n * durationPerSlide - (n - 1) * transitionDuration;

    await execFileAsync('ffmpeg', [
      '-y',
      ...inputs,
      '-filter_complex', filterComplex,
      '-map', '[vout]',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '18',
      '-movflags', '+faststart',
      outputPath,
    ]);

    this.logger.log(
      `Slideshow: ${n} images → ${outputPath} (${totalDuration}s, xfade ${transitionDuration}s)`,
    );
    return { path: outputPath, totalDuration, slideCount: n };
  }

  // ─── Images → Video Grid (side-by-side) ──────────

  /**
   * Create a 2x2 grid video from up to 4 images (useful for comparison/preview).
   */
  async imagesToVideoGrid(
    imagePaths: string[],
    outputPath: string,
    options: { duration?: number; fps?: number; cellSize?: number } = {},
  ): Promise<string> {
    const { duration = 5, fps = 25, cellSize = 540 } = options;
    const count = Math.min(imagePaths.length, 4);
    if (count === 0) {
      throw new BadRequestException('No images provided');
    }

    for (const p of imagePaths.slice(0, count)) {
      if (!fs.existsSync(p)) {
        throw new BadRequestException(`Image not found: ${p}`);
      }
    }
    this.ensureDir(outputPath);

    const inputs = imagePaths
      .slice(0, count)
      .flatMap((p) => ['-loop', '1', '-t', String(duration), '-i', p]);

    // Build filter: scale each, then hstack/vstack
    const scaleFilters = Array.from(
      { length: count },
      (_, i) =>
        `[${i}:v]scale=${cellSize}:${cellSize}:force_original_aspect_ratio=decrease,pad=${cellSize}:${cellSize}:(ow-iw)/2:(oh-ih)/2,fps=${fps}[g${i}]`,
    );

    let stackFilter: string;
    if (count === 1) {
      stackFilter = `[g0]null[vout]`;
    } else if (count === 2) {
      stackFilter = `[g0][g1]hstack=inputs=2[vout]`;
    } else if (count === 3) {
      // 2 on top, 1 centered bottom
      stackFilter = `[g0][g1]hstack=inputs=2[top];color=black:${cellSize}:${cellSize}:d=${duration}[blank];[g2][blank]hstack=inputs=2[bot];[top][bot]vstack=inputs=2[vout]`;
    } else {
      stackFilter = `[g0][g1]hstack=inputs=2[top];[g2][g3]hstack=inputs=2[bot];[top][bot]vstack=inputs=2[vout]`;
    }

    const filterComplex = [...scaleFilters, stackFilter].join(';');

    await execFileAsync('ffmpeg', [
      '-y',
      ...inputs,
      '-filter_complex', filterComplex,
      '-map', '[vout]',
      '-t', String(duration),
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      outputPath,
    ]);

    this.logger.log(`Grid video: ${count} images → ${outputPath}`);
    return outputPath;
  }
}
