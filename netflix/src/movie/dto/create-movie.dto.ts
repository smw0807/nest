import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  // 소수점 허용
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  rating: number;

  @IsNotEmpty()
  @IsNumber()
  year: number;

  // @IsNotEmpty()
  // @IsString()
  // genre: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  genreIds: number[];

  @IsNotEmpty()
  @IsNumber()
  directorId: number;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  actors: string[];

  @IsNotEmpty()
  @IsString()
  detail: string;
}
