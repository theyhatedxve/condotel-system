import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

// Wire the prisma controllers, services, and imported dependencies into Nest.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
