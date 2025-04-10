import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
// import { Role } from 'src/user/entities/user.entity';
import { RBAC } from '../decorator/rbac.decorator';
import { Role } from '@prisma/client';

@Injectable()
export class RBACGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    // RBAC 데코레이터가 있는지 확인
    const requiredRoles = this.reflector.get(RBAC, context.getHandler());

    // Role Enum에 해당되는 값이 데코레이터에 들어갔는지 확인하기
    if (!Object.values(Role).includes(requiredRoles)) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const roleAccessLevel = {
      [Role.admin]: 0,
      [Role.paidUser]: 1,
      [Role.user]: 2,
    };

    return roleAccessLevel[user.role] <= roleAccessLevel[requiredRoles];
  }
}
