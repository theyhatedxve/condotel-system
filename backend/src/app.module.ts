import {
  Module,
} from '@nestjs/common';

import {
  ConfigModule,
} from '@nestjs/config';

import {
  AppController,
} from './app.controller';

import {
  AppService,
} from './app.service';

import {
  AuthModule,
} from './auth/auth.module';

import {
  GuestsModule,
} from './guests/guests.module';

import {
  HealthModule,
} from './health/health.module';

import {
  NotificationsModule,
} from './notifications/notifications.module';

import {
  PaymentsModule,
} from './payments/payments.module';

import {
  PrismaModule,
} from './prisma/prisma.module';

import {
  ReportsModule,
} from './reports/reports.module';

import {
  ReservationsModule,
} from './reservations/reservations.module';

import {
  RoomsModule,
} from './rooms/rooms.module';

import {
  SearchModule,
} from './search/search.module';

import {
  SecurityModule,
} from './security/security.module';

import {
  SettingsModule,
} from './settings/settings.module';

import {
  TransactionsModule,
} from './transactions/transactions.module';

import {
  UserManagementModule,
} from './user-management/user-management.module';

import {
  UsersModule,
} from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,

    SecurityModule,

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

    SearchModule,

    NotificationsModule,

    UserManagementModule,
  ],

  controllers: [
    AppController,
  ],

  providers: [
    AppService,
  ],
})
export class AppModule {}