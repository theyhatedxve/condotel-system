import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  UserRole,
} from '../generated/prisma/enums';

import type {
  AuthenticatedUser,
} from '../auth/interfaces/authenticated-user.interface';

import {
  CurrentUser,
} from '../auth/decorators/current-user.decorator';

import {
  Roles,
} from '../auth/decorators/roles.decorator';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';

import {
  RolesGuard,
} from '../auth/guards/roles.guard';

import {
  AvailabilityQueryDto,
} from './availability-query.dto';

import {
  CreateReservationDto,
} from './create-reservation.dto';

import {
  ReservationQueryDto,
} from './reservation-query.dto';

import {
  UpdateReservationStatusDto,
} from './update-reservation-status.dto';

import {
  ReservationsService,
} from './reservations.service';

@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservationsService:
      ReservationsService,
  ) {}

  @Get('availability')
  findAvailableRooms(
    @Query()
    query: AvailabilityQueryDto,
  ) {
    return this.reservationsService
      .findAvailableRooms(query);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMine(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.reservationsService
      .findMine(user.id);
  }

  @Get()
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    UserRole.STAFF,
    UserRole.ADMIN,
  )
  findAll(
    @Query()
    query: ReservationQueryDto,
  ) {
    return this.reservationsService
      .findAll(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: CreateReservationDto,
  ) {
    return this.reservationsService
      .create(
        user,
        dto,
      );
  }

  @Patch(':id/status')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    UserRole.STAFF,
    UserRole.ADMIN,
  )
  updateStatus(
    @Param('id')
    id: string,

    @Body()
    dto:
      UpdateReservationStatusDto,
  ) {
    return this.reservationsService
      .updateStatus(
        id,
        dto.status,
      );
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(
    @Param('id')
    id: string,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.reservationsService
      .cancel(
        id,
        user,
      );
  }
}