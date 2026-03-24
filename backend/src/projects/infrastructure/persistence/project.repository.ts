import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { Project } from '../../domain/project';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { FilterProjectDto, SortProjectDto } from '../../dto/query-project.dto';

export abstract class ProjectRepository {
  abstract create(
    data: Omit<Project, 'id' | 'createdAt' | 'deletedAt' | 'updatedAt'>,
  ): Promise<Project>;

  abstract findAll(userId: string | number): Promise<Project[]>;

  abstract findManyWithPagination({
    userId,
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    userId: string | number;
    filterOptions?: FilterProjectDto | null;
    sortOptions?: SortProjectDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Project[]>;

  abstract findById(id: Project['id']): Promise<NullableType<Project>>;

  abstract update(
    id: Project['id'],
    payload: DeepPartial<Project>,
  ): Promise<Project | null>;

  abstract remove(id: Project['id']): Promise<void>;
}
