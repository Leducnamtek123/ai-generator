import { IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';

export class CreateTemplateDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  visibility?: string;

  @IsOptional()
  @IsObject()
  content?: any;
}
