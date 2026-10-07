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

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STAFF, UserRole.ADMIN)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

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

  @Get('unread-count')
  getUnreadCount(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch('read-all')
  markAllAsRead(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.notificationsService.markAllAsRead(user.id);
  }

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
