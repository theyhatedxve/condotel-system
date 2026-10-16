import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

// Enforce the request authentication/role checks before the controller handler runs.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Require JWT authentication and block business endpoints until a temporary password
  // has been changed.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const request = context.switchToHttp().getRequest<{
      user: { mustChangePassword?: boolean };
      route?: { path?: string };
    }>();
    const path = request.route?.path || '';
    if (
      request.user.mustChangePassword &&
      !/\/auth\/(me|change-password)$/.test(path)
    ) {
      throw new ForbiddenException(
        'Change your temporary password before continuing.',
      );
    }
    return true;
  }
}
