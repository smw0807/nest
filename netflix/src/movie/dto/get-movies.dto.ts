import { IsOptional, IsString } from 'class-validator';
import { PagePaginationDto } from 'src/common/dto/page-pagination.dto';
import { CursorPaginationDto } from 'src/common/dto/cursor-pagination.dto';
import { ApiProperty } from '@nestjs/swagger';

export class GetMoviesDto extends CursorPaginationDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: '영화 제목',
    example: 'Dark Knight',
  })
  name?: string;
}
