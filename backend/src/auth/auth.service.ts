import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as argon2 from 'argon2';

import { UserStatus } from '../generated/prisma/enums';

import { UsersService } from '../users/users.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingEmail =
      await this.usersService.findByEmail(dto.email);

    if (existingEmail) {
      throw new ConflictException(
        'Email address is already registered.',
      );
    }

    if (dto.username) {
      const existingUsername =
        await this.usersService.findByUsername(
          dto.username,
        );

      if (existingUsername) {
        throw new ConflictException(
          'Username is already taken.',
        );
      }
    }

    const passwordHash = await argon2.hash(
      dto.password,
      {
        type: argon2.argon2id,
      },
    );

    const user =
      await this.usersService.createCustomer({
        email: dto.email,
        username: dto.username,

        passwordHash,

        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
      });

    return {
      message: 'Registration successful.',
      user,
    };
  }

  async login(dto: LoginDto) {
    const user =
      await this.usersService.findByEmailOrUsername(
        dto.identifier,
      );

    if (
      !user ||
      user.status !== UserStatus.ACTIVE
    ) {
      throw new UnauthorizedException(
        'Invalid email/username or password.',
      );
    }

    const passwordMatches =
      await argon2.verify(
        user.passwordHash,
        dto.password,
      );

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Invalid email/username or password.',
      );
    }

    await this.usersService.updateLastLogin(
      user.id,
    );

    const payload: JwtPayload = {
      sub: user.id,
    };

    const accessToken =
      await this.jwtService.signAsync(payload);

    const safeUser =
      await this.usersService.findPublicById(
        user.id,
      );

    return {
      message: 'Login successful.',

      accessToken,

      tokenType: 'Bearer',

      user: safeUser,
    };
  }
}