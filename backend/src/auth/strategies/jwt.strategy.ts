import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import {
  PassportStrategy,
} from '@nestjs/passport';

import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';

import {
  UserStatus,
} from '../../generated/prisma/enums';

import {
  UsersService,
} from '../../users/users.service';

import {
  JwtPayload,
} from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy
  extends PassportStrategy(Strategy)
{
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const jwtSecret =
      configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET is missing from the .env file.',
      );
    }

    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    const user =
      await this.usersService.findById(
        payload.sub,
      );

    if (
      !user ||
      user.status !== UserStatus.ACTIVE
    ) {
      throw new UnauthorizedException(
        'User account is unavailable.',
      );
    }

    return {
      id: user.id,

      email: user.email,
      username: user.username,

      firstName: user.firstName,
      lastName: user.lastName,

      phone: user.phone,

      role: user.role,
      status: user.status,

      mustChangePassword:
        user.mustChangePassword,
    };
  }
}