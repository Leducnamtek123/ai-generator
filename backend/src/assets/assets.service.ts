import { Injectable } from '@nestjs/common';
import { AssetRepository } from './infrastructure/persistence/asset.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';

@Injectable()
export class AssetsService {
  constructor(private readonly assetRepository: AssetRepository) {}

  create(data: {
    type: 'image' | 'video' | 'audio';
    url: string;
    userId: string;
    projectId?: string;
    metadata?: any;
  }) {
    return this.assetRepository.create(data as any);
  }

  findAll(paginationOptions: IPaginationOptions, userId: string) {
    return this.assetRepository.findAllWithPagination(
      paginationOptions,
      userId,
    );
  }

  findOne(id: string) {
    return this.assetRepository.findById(id);
  }

  remove(id: string) {
    return this.assetRepository.remove(id);
  }
}
