import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import { UserRole } from '../generated/prisma/enums';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { Roles } from '../auth/decorators/roles.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { NotificationsService } from './notifications.service';

// Expose notifications HTTP routes with the declared request validation and access
// guards.
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STAFF, UserRole.ADMIN, UserRole.CUSTOMER)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Return the signed-in account's notification list.
  @Get()
  findAll(
    @CurrentUser()
    user: AuthenticatedUser,

    @Query('take')
    take?: string,
  ) {
    const parsedTake = Number(take);

    return this.notificationsService.findForUser(
      user.id,

      Number.isFinite(parsedTake) ? parsedTake : 10,
    );
  }

  // Count unread notifications for this account.
  @Get('unread-count')
  getUnreadCount(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  // Mark all unread notifications belonging to the current account as read.
  @Patch('read-all')
  markAllAsRead(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  // Mark one notification read only when it belongs to the current account.
  @Patch(':id/read')
  markAsRead(
    @Param('id')
    id: string,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.notificationsService.markAsRead(id, user.id);
  }
}
