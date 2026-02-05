import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../../projects/domain/project';

export class Workflow {
  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty({
    type: String,
    nullable: true,
  })
  name?: string | null;

  @ApiProperty({
    type: Object,
  })
  nodes: any;

  @ApiProperty({
    type: Object,
  })
  edges: any;

  @ApiProperty({
    type: () => Project,
  })
  project: Project;

  @ApiProperty({
    type: String,
    default: 'private',
  })
  visibility: string;

  @ApiProperty({
    type: String,
  })
  projectId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}
