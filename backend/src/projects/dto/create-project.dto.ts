import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsObject()
  content?: any;

  @IsOptional()
  @IsString()
  workspaceId?: string;
}
