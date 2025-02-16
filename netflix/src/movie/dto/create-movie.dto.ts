import { IsNotEmpty, IsNumber, IsString, IsArray } from 'class-validator';

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  rating: number;

  @IsNotEmpty()
  @IsNumber()
  year: number;

  @IsNotEmpty()
  @IsString()
  genre: string;

  // todo 삭제
  // @IsNotEmpty()
  // @IsString()
  // director: string;

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
