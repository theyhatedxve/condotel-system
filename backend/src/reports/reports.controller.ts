import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { UserRole } from '../generated/prisma/enums';

import { Roles } from '../auth/decorators/roles.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { ReportRangeQueryDto } from './report-range-query.dto';

import { ReportsService } from './reports.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

// Expose reports HTTP routes with the declared request validation and access guards.
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STAFF, UserRole.ADMIN)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Gather management occupancy, guest, payment, and recent-reservation summaries.
  @Get('dashboard')
  @Roles(UserRole.STAFF, UserRole.ADMIN, UserRole.CUSTOMER)
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return user.role === UserRole.CUSTOMER
      ? this.reportsService.getCustomerDashboard(user.id)
      : this.reportsService.getDashboard();
  }

  // Aggregate reservations, payments, transactions, and room performance for the
  // selected report range.
  @Get('summary')
  getSummary(
    @Query()
    query: ReportRangeQueryDto,
  ) {
    return this.reportsService.getSummary(query);
  }
}
