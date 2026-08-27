import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { Role } from '../../users/enums/roles.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { User } from '../../users/entities/users.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request: Request = context.switchToHttp().getRequest();
    const user: User = request['user'];

    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }

      const hasRequiredRole = user.role.some((role: Role) => requiredRoles.includes(role));
      if (!hasRequiredRole) {
        throw new ForbiddenException('لا تملك صلاحيات كافية    ');
      }
      return true;    
  }
}
