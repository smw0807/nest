import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '영화 제목',
    example: 'Dark Knight',
  })
  name: string;

  // 소수점 허용
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({
    description: '영화 평점',
    example: 8.5,
  })
  rating: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: '영화 연도',
    example: 2008,
  })
  year: number;

  // @IsNotEmpty()
  // @IsString()
  // genre: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @ApiProperty({
    description: '영화 장르 ID',
    example: [1, 2, 3],
  })
  genreIds: number[];

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: '영화 감독 ID',
    example: 1,
  })
  directorId: number;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: '영화 배우',
    example: ['Tom Cruise', 'Tom Hanks'],
  })
  actors: string[];

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '영화 상세 설명',
    example: '영화 상세 설명',
  })
  detail: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '영화 파일 이름',
    example: 'movie.mp4',
  })
  movieFileName: string;
}
