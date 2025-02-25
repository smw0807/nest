import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    const reqTime = Date.now();
    return next.handle().pipe(
      tap(() => {
        const resTime = Date.now();
        const diff = resTime - reqTime;

        if (diff > 1000) {
          console.log(`!!!TIME OUT!!! [${req.method} ${req.path}] ${diff}ms`);
          throw new InternalServerErrorException(
            '시간이 너무 오래 걸렸습니다.',
          );
        } else {
          console.log(`[${req.method} ${req.path}] ${diff}ms`);
        }
      }),
    );
  }
}
