import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  UserRole,
} from '../generated/prisma/enums';

import {
  AuthService,
} from './auth.service';

import {
  CurrentUser,
} from './decorators/current-user.decorator';

import {
  Roles,
} from './decorators/roles.decorator';

import {
  LoginDto,
} from './dto/login.dto';

import {
  RegisterDto,
} from './dto/register.dto';

import {
  JwtAuthGuard,
} from './guards/jwt-auth.guard';

import {
  RolesGuard,
} from './guards/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  register(
    @Body() dto: RegisterDto,
  ) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body() dto: LoginDto,
  ) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(
    @CurrentUser() user: unknown,
  ) {
    return {
      user,
    };
  }

  @Get('staff-test')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    UserRole.STAFF,
    UserRole.ADMIN,
  )
  staffTest(
    @CurrentUser() user: unknown,
  ) {
    return {
      message:
        'You have Staff or Admin access.',

      user,
    };
  }

  @Get('admin-test')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    UserRole.ADMIN,
  )
  adminTest(
    @CurrentUser() user: unknown,
  ) {
    return {
      message:
        'You have Admin access.',

      user,
    };
  }
}