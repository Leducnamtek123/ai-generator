import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsObject } from 'class-validator';

export class ExecuteWorkflowDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  graph?: {
    nodes: any[];
    edges: any[];
  };
}
