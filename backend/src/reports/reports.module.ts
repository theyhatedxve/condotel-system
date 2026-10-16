import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { ReportsController } from './reports.controller';

import { ReportsService } from './reports.service';

// Wire the reports controllers, services, and imported dependencies into Nest.
@Module({
  imports: [AuthModule],

  controllers: [ReportsController],

  providers: [ReportsService],

  exports: [ReportsService],
})
export class ReportsModule {}
