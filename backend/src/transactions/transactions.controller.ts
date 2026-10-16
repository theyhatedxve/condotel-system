import { Controller, Get, UseGuards } from '@nestjs/common';

import { UserRole } from '../generated/prisma/enums';

import { Roles } from '../auth/decorators/roles.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { TransactionsService } from './transactions.service';

// Expose transactions HTTP routes with the declared request validation and access
// guards.
@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STAFF, UserRole.ADMIN)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // List recorded payment transactions with reservation, room, and authorized guest
  // details.
  @Get()
  findAll() {
    return this.transactionsService.findAll();
  }
}
