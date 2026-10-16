import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { TransactionsController } from './transactions.controller';

import { TransactionsService } from './transactions.service';

// Wire the transactions controllers, services, and imported dependencies into Nest.
@Module({
  imports: [AuthModule],

  controllers: [TransactionsController],

  providers: [TransactionsService],

  exports: [TransactionsService],
})
export class TransactionsModule {}
