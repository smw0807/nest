import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { PagePaginationDto } from './dto/page-pagination.dto';
import { CursorPaginationDto } from './dto/cursor-pagination.dto';

@Injectable()
export class CommonService {
  constructor() {}

  applyPagePaginationParamsToQb<T>(
    qb: SelectQueryBuilder<T>,
    dto: PagePaginationDto,
  ) {
    const { page, take } = dto;
    qb.skip((page - 1) * take).take(take);
  }

  applyCursorPaginationParamsToQb<T>(
    qb: SelectQueryBuilder<T>,
    dto: CursorPaginationDto,
  ) {
    const { id, order, take } = dto;
    if (id) {
      const direction = order === 'ASC' ? '>' : '<';
      qb.where(`${qb.alias}.id ${direction} :id`, { id });
    }
    qb.orderBy(`${qb.alias}.id`, order);
    qb.take(take);
  }
}
