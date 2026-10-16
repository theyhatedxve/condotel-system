import { Module } from '@nestjs/common';

import { UsersService } from './users.service';

// Wire the users controllers, services, and imported dependencies into Nest.
@Module({
  providers: [UsersService],

  exports: [UsersService],
})
export class UsersModule {}
