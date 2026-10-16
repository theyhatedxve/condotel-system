import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

import { PrismaClient } from '../generated/prisma/client';

// Implement prisma operations using the injected dependencies and existing business
// rules.
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is missing. Check your backend/.env file.');
    }

    const adapter = new PrismaBetterSqlite3({
      url: databaseUrl,
    });

    super({
      adapter,
    });
  }

  // Connect the Prisma client when Nest initializes the database service.
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  // Disconnect the Prisma client when Nest shuts the service down.
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
