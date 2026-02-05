import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsUUID,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WorkflowNodeDto {
  @IsString()
  id: string;

  @IsString()
  type: string;

  @IsObject()
  data: Record<string, any>;

  @IsObject()
  position: { x: number; y: number };
}

export class WorkflowEdgeDto {
  @IsString()
  id: string;

  @IsString()
  source: string;

  @IsString()
  target: string;

  @IsOptional()
  @IsString()
  sourceHandle?: string;

  @IsOptional()
  @IsString()
  targetHandle?: string;
}

export class CreateWorkflowDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsString()
  previewUrl?: string;

  @IsOptional()
  @IsString()
  visibility?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowNodeDto)
  nodes?: WorkflowNodeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowEdgeDto)
  edges?: WorkflowEdgeDto[];
}
