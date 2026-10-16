import { Module } from '@nestjs/common';

import { HealthController } from './health.controller';

// Wire the health controllers, services, and imported dependencies into Nest.
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
