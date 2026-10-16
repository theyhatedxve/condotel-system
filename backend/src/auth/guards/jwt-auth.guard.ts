import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
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
