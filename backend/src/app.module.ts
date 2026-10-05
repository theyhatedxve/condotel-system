import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RoomsModule } from './rooms/rooms.module';
import { GuestsModule } from './guests/guests.module';
import { ReservationsModule } from './reservations/reservations.module';
import { PaymentsModule } from './payments/payments.module';
import {
  TransactionsModule,
} from './transactions/transactions.module';
import {
  ReportsModule,
} from './reports/reports.module';

import {
  SettingsModule,
} from './settings/settings.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
    RoomsModule,
    GuestsModule,
    ReservationsModule,
    PaymentsModule,
    TransactionsModule,
    ReportsModule,
    SettingsModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}