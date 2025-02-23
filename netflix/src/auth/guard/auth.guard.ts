import { CanActivate, ExecutionContext } from '@nestjs/common';

export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // 요청에서 user 객체가 존재하는지 확인
    const request = context.switchToHttp().getRequest();
    if (!request.user || request.user.type !== 'access') {
      return false;
    }
    return true;
  }
}
