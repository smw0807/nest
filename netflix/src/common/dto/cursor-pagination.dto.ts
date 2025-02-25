import { IsArray, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class CursorPaginationDto {
  @IsString()
  @IsOptional()
  // id_52, likeCount_20
  cursor?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  // [id_DESC, likeCount_DESC]
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
