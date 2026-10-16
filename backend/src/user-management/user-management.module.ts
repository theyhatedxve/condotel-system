import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { UserManagementController } from './user-management.controller';

import { UserManagementService } from './user-management.service';

// Wire the user management controllers, services, and imported dependencies into Nest.
@Module({
  imports: [AuthModule],

  controllers: [UserManagementController],

  providers: [UserManagementService],
})
export class UserManagementModule {}
