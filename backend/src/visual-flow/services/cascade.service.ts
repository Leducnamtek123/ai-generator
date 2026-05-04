import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VisualSceneEntity } from '../entities/visual-scene.entity';
import { VisualCharacterEntity } from '../entities/visual-character.entity';

/**
 * Cascade result handler — manages downstream status invalidation.
 * Ported from FlowKit: when upstream asset changes, downstream assets
 * are automatically invalidated to prevent stale references.
 *
 * Cascade chain: Image → Video → Upscale
 * - Regen image → clears video + upscale
 * - Regen video → clears upscale
 */
@Injectable()
export class CascadeService {
  private readonly logger = new Logger(CascadeService.name);

  constructor(
    @InjectRepository(VisualSceneEntity)
    private readonly sceneRepo: Repository<VisualSceneEntity>,
    @InjectRepository(VisualCharacterEntity)
    private readonly characterRepo: Repository<VisualCharacterEntity>,
  ) {}

  /**
   * Apply cascade invalidation when a scene image is regenerated.
   * Clears downstream video and upscale for the given orientation.
   */
  async onImageRegenerated(
    sceneId: string,
    orientation: 'VERTICAL' | 'HORIZONTAL',
    newImageUrl?: string,
  ): Promise<{ clearedVideo: boolean; clearedUpscale: boolean }> {
    const p = orientation === 'HORIZONTAL' ? 'horizontal' : 'vertical';
    const scene = await this.sceneRepo.findOneBy({ id: sceneId });
    if (!scene) return { clearedVideo: false, clearedUpscale: false };

    const updates: Partial<VisualSceneEntity> = {};

    // Set new image
    if (newImageUrl) {
      (updates as any)[`${p}ImageUrl`] = newImageUrl;
      (updates as any)[`${p}ImageStatus`] = 'COMPLETED';
    }

    // Cascade: clear video
    const hadVideo = !!(scene as any)[`${p}VideoUrl`];
    (updates as any)[`${p}VideoUrl`] = null;
    (updates as any)[`${p}VideoStatus`] = 'PENDING';

    // Cascade: clear upscale (if schema supports it)
    const hadUpscale = false; // Extend if upscale fields exist
    // (updates as any)[`${p}UpscaleUrl`] = null;
    // (updates as any)[`${p}UpscaleStatus`] = 'PENDING';

    await this.sceneRepo.update(sceneId, updates);

    // Also update parent's end frame reference if this is a child scene
    if (scene.parentSceneId && newImageUrl) {
      // Parent's end_scene_media references this child's image for smooth i2v transition
      this.logger.log(
        `Cascade: parent ${scene.parentSceneId} end-frame reference will need update`,
      );
    }

    // Cascade to children: if any continuation scenes use this as parent,
    // their start frames may be stale
    const children = await this.sceneRepo.find({
      where: { parentSceneId: sceneId },
    });
    for (const child of children) {
      this.logger.log(
        `Cascade: marking child scene ${child.id} for potential regeneration`,
      );
      // Optionally mark children as needing regeneration
      // await this.sceneRepo.update(child.id, { [`${p}ImageStatus`]: 'STALE' });
    }

    this.logger.log(
      `Cascade (image regen): scene=${sceneId}, cleared video=${hadVideo}, cleared upscale=${hadUpscale}`,
    );

    return { clearedVideo: hadVideo, clearedUpscale: hadUpscale };
  }

  /**
   * Apply cascade invalidation when a scene video is regenerated.
   * Clears downstream upscale for the given orientation.
   */
  async onVideoRegenerated(
    sceneId: string,
    orientation: 'VERTICAL' | 'HORIZONTAL',
    newVideoUrl?: string,
  ): Promise<{ clearedUpscale: boolean }> {
    const p = orientation === 'HORIZONTAL' ? 'horizontal' : 'vertical';
    const scene = await this.sceneRepo.findOneBy({ id: sceneId });
    if (!scene) return { clearedUpscale: false };

    const updates: Partial<VisualSceneEntity> = {};

    if (newVideoUrl) {
      (updates as any)[`${p}VideoUrl`] = newVideoUrl;
      (updates as any)[`${p}VideoStatus`] = 'COMPLETED';
    }

    // Cascade: clear upscale
    // (updates as any)[`${p}UpscaleUrl`] = null;
    // (updates as any)[`${p}UpscaleStatus`] = 'PENDING';

    if (Object.keys(updates).length) {
      await this.sceneRepo.update(sceneId, updates);
    }

    this.logger.log(
      `Cascade (video regen): scene=${sceneId}, orientation=${orientation}`,
    );
    return { clearedUpscale: false };
  }

  /**
   * Bulk cascade check — identify all scenes with stale downstream assets.
   */
  async findStaleScenes(videoId: string): Promise<{
    pendingVideos: string[];
    pendingUpscales: string[];
  }> {
    const scenes = await this.sceneRepo.find({
      where: { videoId },
      order: { displayOrder: 'ASC' },
    });

    const pendingVideos: string[] = [];
    const pendingUpscales: string[] = [];

    for (const scene of scenes) {
      // Check if image completed but video still pending
      if (
        scene.verticalImageStatus === 'COMPLETED' &&
        scene.verticalVideoStatus === 'PENDING'
      ) {
        pendingVideos.push(scene.id);
      }
      if (
        scene.horizontalImageStatus === 'COMPLETED' &&
        scene.horizontalVideoStatus === 'PENDING'
      ) {
        pendingVideos.push(scene.id);
      }
    }

    return { pendingVideos, pendingUpscales };
  }
}
