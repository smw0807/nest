import { BadRequestException, Injectable } from '@nestjs/common';
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

  async applyCursorPaginationParamsToQb<T>(
    qb: SelectQueryBuilder<T>,
    dto: CursorPaginationDto,
  ) {
    let { cursor, order, take } = dto;
    if (cursor) {
      const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
      /**
       * {
       *  values: {
       *    id: 1,
       *  },
       *  order: [
       *    'id_DESC',
       *  ],
       * }
       */
      const cursorObj = JSON.parse(decodedCursor);
      order = cursorObj.order;

      const { values } = cursorObj; //{ likeCount: 20, id: 30 }
      const columns = Object.keys(values); //[likeCount, id]
      const comparisonOperator = order.some((o) => o.endsWith('DESC'))
        ? '<'
        : '>';
      const whereConditions = columns.map((c) => `${qb.alias}.${c}`).join(','); //movie.likeCount, movie.id
      const whereParams = columns.map((c) => `:${c}`).join(','); //:likeCount, :id
      qb.where(
        `(${whereConditions}) ${comparisonOperator} (${whereParams})`,
        values,
      );
    }

    // [id_DESC, likeCount_DESC]
    for (let i = 0; i < order.length; i++) {
      const [column, direction] = order[i].split('_');
      if (direction !== 'DESC' && direction !== 'ASC') {
        throw new BadRequestException('Order는 ASC 또는 DESC로 입력해주세요.');
      }
      if (i === 0) {
        qb.orderBy(`${qb.alias}.${column}`, direction);
      } else {
        qb.addOrderBy(`${qb.alias}.${column}`, direction);
      }
    }
    qb.take(take);
    const results = await qb.getMany();
    const nextCursor = this.generateNextCursor(results, order);
    return { qb, nextCursor };
  }

  generateNextCursor<T>(results: T[], order: string[]): string | null {
    if (results.length === 0) return null;
    /**
     * {
     *  values: {
     *    id: 1,
     *  },
     *  order: [
     *    'id_DESC',
     *  ],
     * }
     */
    const lastItem = results[results.length - 1];
    const values = {};
    order.forEach((columnOrder) => {
      const [column] = columnOrder.split('_');
      values[column] = lastItem[column];
    });

    const cursorObj = { values, order };
    const nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString(
      'base64',
    );
    return nextCursor;
  }
}
