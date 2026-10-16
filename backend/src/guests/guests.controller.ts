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

@Controller('guests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STAFF, UserRole.ADMIN)
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Get()
  findAll(
    @Query()
    query: GuestQueryDto,
  ) {
    return this.guestsService.findAll(query.search, query.page, query.status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.guestsService.findOne(id);
  }

  @Post()
  create(
    @Body()
    dto: CreateGuestDto,
  ) {
    return this.guestsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,

    @Body()
    dto: UpdateGuestDto,
  ) {
    return this.guestsService.update(id, dto);
  }
}
