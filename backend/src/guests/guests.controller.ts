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

import { Roles } from '../auth/decorators/roles.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { CreateGuestDto } from './create-guest.dto';

import { UpdateGuestDto } from './update-guest.dto';

import { GuestsService } from './guests.service';
import { GuestQueryDto } from './guest-query.dto';

// Expose guests HTTP routes with the declared request validation and access guards.
@Controller('guests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STAFF, UserRole.ADMIN)
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  // List customer accounts with optional contact/name search, status filtering, and
  // pagination.
  @Get()
  findAll(
    @Query()
    query: GuestQueryDto,
  ) {
    return this.guestsService.findAll(query.search, query.page, query.status);
  }

  // Load a customer account and decrypt the selected contact/profile fields.
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.guestsService.findOne(id);
  }

  // Validate guest identifiers and create an encrypted customer profile with a temporary
  // password.
  @Post()
  create(
    @Body()
    dto: CreateGuestDto,
  ) {
    return this.guestsService.create(dto);
  }

  // Update an existing customer and its encrypted profile while preserving omitted
  // fields.
  @Patch(':id')
  update(
    @Param('id') id: string,

    @Body()
    dto: UpdateGuestDto,
  ) {
    return this.guestsService.update(id, dto);
  }
}
