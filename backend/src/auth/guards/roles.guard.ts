import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

import {
  Reflector,
} from '@nestjs/core';

import {
  UserRole,
} from '../../generated/prisma/enums';

import {
  ROLES_KEY,
} from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard
  implements CanActivate
{
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean {
    // Method-level roles override controller defaults, allowing stricter write permissions.
    const requiredRoles =
      this.reflector.getAllAndOverride<
        UserRole[]
      >(
        ROLES_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    if (
      !requiredRoles ||
      requiredRoles.length === 0
    ) {
      return true;
    }

    const request =
      context.switchToHttp().getRequest();

    // JwtAuthGuard must run first to attach the database-backed user to the request.
    const user = request.user;

    if (!user) {
      return false;
    }

    return requiredRoles.includes(
      user.role,
    );
  }
}