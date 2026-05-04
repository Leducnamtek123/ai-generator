import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VisualSceneEntity } from '../entities/visual-scene.entity';

/**
 * Scene chain service — handles continuation scenes (scene chaining).
 * Ported from FlowKit: continuation scenes inherit the end-frame of
 * the parent scene for smooth video transitions.
 *
 * Chain types:
 * - ROOT: standalone scene (no parent)
 * - CONTINUATION: video continues from parent's last frame
 * - INSERT: inserted between existing scenes (re-orders display)
 */

export type ChainType = 'ROOT' | 'CONTINUATION' | 'INSERT';

@Injectable()
export class SceneChainService {
  private readonly logger = new Logger(SceneChainService.name);

  constructor(
    @InjectRepository(VisualSceneEntity)
    private readonly sceneRepo: Repository<VisualSceneEntity>,
  ) {}

  /**
   * Create a CONTINUATION scene — the new scene's start frame will be
   * the parent scene's end frame, ensuring seamless video transitions.
   */
  async createContinuationScene(
    videoId: string,
    parentSceneId: string,
    prompt: string,
    options: {
      characterNames?: string[];
      videoPrompt?: string;
      displayOrder?: number;
    } = {},
  ): Promise<VisualSceneEntity> {
    // Get parent scene
    const parent = await this.sceneRepo.findOneBy({ id: parentSceneId });
    if (!parent) {
      throw new Error(`Parent scene ${parentSceneId} not found`);
    }

    // Determine display order
    let displayOrder = options.displayOrder;
    if (displayOrder == null) {
      // Place right after parent, shift everyone else
      displayOrder = parent.displayOrder + 1;
      const siblings = await this.sceneRepo.find({
        where: { videoId },
        order: { displayOrder: 'ASC' },
      });
      for (const s of siblings) {
        if (s.displayOrder >= displayOrder && s.id !== parentSceneId) {
          s.displayOrder += 1;
          await this.sceneRepo.save(s);
        }
      }
    }

    // Create continuation scene
    const scene = this.sceneRepo.create({
      videoId,
      displayOrder,
      prompt,
      chainType: 'CONTINUATION',
      parentSceneId,
      // Inherit start frame from parent's video (for i2v continuity)
      verticalImageStatus: 'PENDING',
      horizontalImageStatus: 'PENDING',
      verticalVideoStatus: 'PENDING',
      horizontalVideoStatus: 'PENDING',
    });

    const saved = await this.sceneRepo.save(scene);

    this.logger.log(
      `Created continuation scene ${saved.id} (order=${displayOrder}) from parent ${parentSceneId}`,
    );
    return saved;
  }

  /**
   * Create an INSERT scene — placed at a specific position, shifting
   * existing scenes to make room.
   */
  async createInsertScene(
    videoId: string,
    atOrder: number,
    prompt: string,
    options: {
      characterNames?: string[];
    } = {},
  ): Promise<VisualSceneEntity> {
    // Shift existing scenes at or after this position
    const scenes = await this.sceneRepo.find({
      where: { videoId },
      order: { displayOrder: 'ASC' },
    });
    for (const s of scenes) {
      if (s.displayOrder >= atOrder) {
        s.displayOrder += 1;
        await this.sceneRepo.save(s);
      }
    }

    const scene = this.sceneRepo.create({
      videoId,
      displayOrder: atOrder,
      prompt,
      chainType: 'INSERT',
      verticalImageStatus: 'PENDING',
      horizontalImageStatus: 'PENDING',
      verticalVideoStatus: 'PENDING',
      horizontalVideoStatus: 'PENDING',
    });

    const saved = await this.sceneRepo.save(scene);
    this.logger.log(
      `Created insert scene ${saved.id} at order=${atOrder}`,
    );
    return saved;
  }

  /**
   * Get the chain info for a scene — parent, children, chain type.
   */
  async getChainInfo(sceneId: string): Promise<{
    scene: VisualSceneEntity;
    parent: VisualSceneEntity | null;
    children: VisualSceneEntity[];
    chainType: ChainType;
  }> {
    const scene = await this.sceneRepo.findOneBy({ id: sceneId });
    if (!scene) throw new Error(`Scene ${sceneId} not found`);

    const parent = scene.parentSceneId
      ? await this.sceneRepo.findOneBy({ id: scene.parentSceneId })
      : null;

    const children = await this.sceneRepo.find({
      where: { parentSceneId: sceneId },
      order: { displayOrder: 'ASC' },
    });

    return {
      scene,
      parent,
      children,
      chainType: (scene.chainType as ChainType) || 'ROOT',
    };
  }

  /**
   * Reorder scenes within a video (drag & drop support).
   */
  async reorderScenes(
    videoId: string,
    sceneIds: string[],
  ): Promise<void> {
    for (let i = 0; i < sceneIds.length; i++) {
      await this.sceneRepo.update(sceneIds[i], {
        displayOrder: i,
      });
    }
    this.logger.log(
      `Reordered ${sceneIds.length} scenes in video ${videoId}`,
    );
  }

  /**
   * Cleanup scenes by chain type — delete all scenes of a given type
   * and re-compact displayOrder (0, 1, 2, ...) for remaining.
   * Useful for bulk-removing system-generated INSERT/CONTINUATION scenes.
   */
  async cleanupScenes(
    videoId: string,
    chainType: ChainType,
  ): Promise<{ deleted: number; remaining: number }> {
    const scenes = await this.sceneRepo.find({
      where: { videoId },
      order: { displayOrder: 'ASC' },
    });

    const toDelete = scenes.filter(
      (s) => s.chainType === chainType,
    );
    const toKeep = scenes
      .filter((s) => s.chainType !== chainType)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    // Delete matching scenes
    for (const s of toDelete) {
      await this.sceneRepo.delete(s.id);
    }

    // Re-compact displayOrder
    for (let i = 0; i < toKeep.length; i++) {
      if (toKeep[i].displayOrder !== i) {
        await this.sceneRepo.update(toKeep[i].id, { displayOrder: i });
      }
    }

    this.logger.log(
      `Cleanup: deleted ${toDelete.length} ${chainType} scenes, ${toKeep.length} remaining in video ${videoId}`,
    );

    return { deleted: toDelete.length, remaining: toKeep.length };
  }
}
