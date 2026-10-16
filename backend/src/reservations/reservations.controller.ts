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

import { UserRole } from '../generated/prisma/enums';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { Roles } from '../auth/decorators/roles.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { AvailabilityQueryDto } from './availability-query.dto';

import { CreateReservationDto } from './create-reservation.dto';

import { ReservationQueryDto } from './reservation-query.dto';

import { UpdateReservationStatusDto } from './update-reservation-status.dto';

import { ReservationsService } from './reservations.service';
import { UpdateReservationNotesDto } from './update-reservation-notes.dto';

// Expose reservations HTTP routes with the declared request validation and access
// guards.
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  // Find active rooms with sufficient capacity and no blocking reservation for the stay.
  @Get('availability')
  findAvailableRooms(
    @Query()
    query: AvailabilityQueryDto,
  ) {
    return this.reservationsService.findAvailableRooms(query);
  }

  // Return only the signed-in customer's reservations with authorized private fields
  // restored.
  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMine(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.reservationsService.findMine(user.id);
  }

  // List reservations for management with optional status filtering and pagination.
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  findAll(
    @Query()
    query: ReservationQueryDto,
  ) {
    return this.reservationsService.findAll(query);
  }

  // Validate the guest and stay, check availability atomically, calculate the server
  // total, and save encrypted notes.
  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: CreateReservationDto,
  ) {
    return this.reservationsService.create(user, dto);
  }

  // Enforce allowed reservation transitions and verified payment before updating
  // reservation/room status.
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  updateStatus(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateReservationStatusDto,
  ) {
    return this.reservationsService.updateStatus(id, dto.status);
  }

  // Delegate an individual reservation lookup with the current account for access
  // checks.
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.reservationsService.findOneAuthorized(id, user);
  }

  // Authorize the caller and update only supplied notes/arrival information on an
  // editable reservation.
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateNotes(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateReservationNotesDto,
  ) {
    return this.reservationsService.updateNotes(id, user, dto);
  }

  // Authorize a cancellation request before applying the existing cancellation rules.
  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(
    @Param('id')
    id: string,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.reservationsService.cancel(id, user);
  }
}
