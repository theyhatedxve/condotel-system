import { Controller, Get } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

// Expose health HTTP routes with the declared request validation and access guards.
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  // Return the basic API health response.
  @Get()
  getHealth() {
    return {
      status: 'ok',
      application: 'NEXORA System API',
    };
  }

  // Check database connectivity and return its health result.
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
