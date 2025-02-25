import { IsIn, IsInt, IsOptional } from 'class-validator';

export class CursorPaginationDto {
  @IsInt()
  @IsOptional()
  id: number;

  @IsIn(['ASC', 'DESC'])
  @IsOptional()
  order: 'ASC' | 'DESC' = 'DESC';

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
