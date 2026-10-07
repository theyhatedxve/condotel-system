import { Controller, Get } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      application: 'Condotel System API',
    };
  }

  @Get('database')
  async getDatabaseHealth() {
    const userCount = await this.prisma.user.count();

    return {
      status: 'ok',
      database: 'SQLite',
      connection: 'connected',
      userCount,
    };
  }
}
