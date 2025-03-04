import { ConsoleLogger, Injectable } from '@nestjs/common';

@Injectable()
export class DefaultLogger extends ConsoleLogger {
  warn(message: unknown, ...rest: unknown[]): void {
    // 오류 메시지 발생 시 추가적인 로직을 여기에 추가하면 기본 로그 메시지 출력 시 추가적인 로직을 수행할 수 있음
    super.warn(message, ...rest);
  }

  error(message: unknown, ...rest: unknown[]): void {
    super.error(message, ...rest);
  }
}
