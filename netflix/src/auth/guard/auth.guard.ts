import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Public } from '../decorator/public.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Public 데코레이터가 있으면 bypass
    const isPublic = this.reflector.get(Public, context.getHandler());
    if (isPublic) {
      return true;
    }

    // 요청에서 user 객체가 존재하는지 확인
    const request = context.switchToHttp().getRequest();
    if (!request.user || request.user.type !== 'access') {
      return false;
    }
    return true;
  }
}
