import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { GenerationEntity } from '../entities/generation.entity';

@Injectable()
export class GenerationEventsService {
  private readonly generationUpdated$ = new Subject<{
    generation: GenerationEntity;
    projectId?: string;
  }>();

  get generationUpdated() {
    return this.generationUpdated$.asObservable();
  }

  emitUpdate(generation: GenerationEntity, projectId?: string) {
    this.generationUpdated$.next({ generation, projectId });
  }
}
