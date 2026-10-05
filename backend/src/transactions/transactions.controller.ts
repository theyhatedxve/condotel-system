import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import {
  UserRole,
} from '../generated/prisma/enums';

import {
  Roles,
} from '../auth/decorators/roles.decorator';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';

import {
  RolesGuard,
} from '../auth/guards/roles.guard';

import {
  TransactionsService,
} from './transactions.service';

@Controller('transactions')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
@Roles(
  UserRole.STAFF,
  UserRole.ADMIN,
)
export class TransactionsController {
  constructor(
    private readonly transactionsService:
      TransactionsService,
  ) {}

  @Get()
  findAll() {
    return this.transactionsService
      .findAll();
  }
}