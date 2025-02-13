import { IsNotEmpty, IsNumber, IsString, IsArray } from 'class-validator';

export class CreateMovieDto {
  id?: number;
  @IsNotEmpty()
  @IsString()
  name: string;
  @IsNotEmpty()
  @IsString()
  description: string;
  @IsNotEmpty()
  @IsNumber()
  rating: number;
  @IsNotEmpty()
  @IsNumber()
  year: number;
  @IsNotEmpty()
  @IsString()
  genre: string;
  @IsNotEmpty()
  @IsString()
  director: string;
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  actors: string[];
}
