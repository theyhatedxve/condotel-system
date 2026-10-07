import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { UserRole } from '../generated/prisma/enums';

import { Roles } from '../auth/decorators/roles.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { ReportRangeQueryDto } from './report-range-query.dto';

import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STAFF, UserRole.ADMIN)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  getDashboard() {
    return this.reportsService.getDashboard();
  }

  @Get('summary')
  getSummary(
    @Query()
    query: ReportRangeQueryDto,
  ) {
    return this.reportsService.getSummary(query);
  }
}
