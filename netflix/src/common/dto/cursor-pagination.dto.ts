import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class CursorPaginationDto {
  @IsString()
  @IsOptional()
  // id_52, likeCount_20
  @ApiProperty({
    description: '커서',
    example: 'eyJ2YWx1ZXMiOnsiaWQiOjc4fSwib3JkZXIiOlsiaWRfREVTQyJdfQ==',
  })
  cursor?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  // [id_DESC, likeCount_DESC]
  @ApiProperty({
    description: '정렬',
    example: ['id_DESC', 'likeCount_DESC'],
  })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  order: string[] = ['id_DESC'];

  @IsInt()
  @IsOptional()
  take: number = 10;
}
/*
select id, "likeCount", name from movie
where id < 65 
order by id desc
limit 5

select id, name, "likeCount" from movie m 
where ("likeCount" < 20)
or ("likeCount" = 20 and id < 30)
order by "likeCount" desc, id desc
limit 5
;

select id, name, "likeCount" from movie 
where ("likeCount", id) < (20, 25)
order by "likeCount" desc, id desc
limit 5;
*/
