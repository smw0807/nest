import { IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

export class UpdateMovieDto {
  @IsOptional()
  @IsString()
  name?: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsOptional()
  @IsNumber()
  rating?: number;
  @IsOptional()
  @IsNumber()
  year?: number;
  @IsOptional()
  @IsString()
  genre?: string;
  @IsOptional()
  @IsString()
  director?: string;
  @IsOptional()
  @IsArray()
  cast?: string[];
}
