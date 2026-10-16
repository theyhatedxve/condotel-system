import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as argon2 from 'argon2';

import { UserStatus } from '../generated/prisma/enums';

import { UsersService } from '../users/users.service';

import { ChangePasswordDto } from './dto/change-password.dto';

import { LoginDto } from './dto/login.dto';

import { RegisterDto } from './dto/register.dto';

import { UpdateProfileDto } from './dto/update-profile.dto';

import { JwtPayload } from './interfaces/jwt-payload.interface';

// Implement auth operations using the injected dependencies and existing business rules.
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,

    private readonly jwtService: JwtService,
  ) {}

  // Reject duplicate identifiers, hash the password, and create a customer account.
  async register(dto: RegisterDto) {
    const existingEmail = await this.usersService.findByEmail(dto.email);

    if (existingEmail) {
      throw new ConflictException('Email address is already registered.');
    }

    if (dto.username) {
      const existingUsername = await this.usersService.findByUsername(
        dto.username,
      );

      if (existingUsername) {
        throw new ConflictException('Username is already taken.');
      }
    }

    // Hash passwords with Argon2id; AES protects fields that authorized code must read.
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    const user = await this.usersService.createCustomer({
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

  // Verify an active account and password, record login time, and return its JWT and
  // public profile.
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailOrUsername(dto.identifier);

    // Login failures share one message so account existence and status are not disclosed.
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid email/username or password.');
    }

    const passwordMatches = await argon2.verify(
      user.passwordHash,
      dto.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email/username or password.');
    }

    await this.usersService.updateLastLogin(user.id);

    const payload: JwtPayload = {
      sub: user.id,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    const safeUser = await this.usersService.findPublicById(user.id);

    return {
      message: 'Login successful.',

      accessToken,

      tokenType: 'Bearer',

      user: safeUser,
    };
  }

  // Update the signed-in account through the validated user service.
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(userId, dto);

    return {
      message: 'Profile updated successfully.',

      user,
    };
  }

  // Verify the current password before storing a new hash and clearing the
  // temporary-password requirement.
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User account is unavailable.');
    }

    const currentPasswordMatches = await argon2.verify(
      user.passwordHash,
      dto.currentPassword,
    );

    if (!currentPasswordMatches) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    const samePassword = await argon2.verify(
      user.passwordHash,
      dto.newPassword,
    );

    if (samePassword) {
      throw new BadRequestException(
        'New password must be different from the current password.',
      );
    }

    const passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
    });

    const updatedUser = await this.usersService.updatePassword(
      user.id,
      passwordHash,
      false,
    );

    return {
      message: 'Password changed successfully.',

      user: updatedUser,
    };
  }
}
