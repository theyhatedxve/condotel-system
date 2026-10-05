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
  RoomStatus,
} from '../generated/prisma/enums';

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
  CreateRoomDto,
} from './dto/create-room.dto';

import {
  UpdateRoomDto,
} from './dto/update-room.dto';

import {
  UpdateRoomStatusDto,
} from './dto/update-room-status.dto';

import {
  RoomsService,
} from './rooms.service';

@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService:
      RoomsService,
  ) {}

  // Public active room list.
  @Get()
  findAll(
    @Query('status')
    status?: RoomStatus,
  ) {
    return this.roomsService.findAll(
      status,
    );
  }

  // Staff/Admin management list.
  @Get('management')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    UserRole.STAFF,
    UserRole.ADMIN,
  )
  findAllForManagement(
    @Query('status')
    status?: RoomStatus,
  ) {
    return this.roomsService
      .findAllForManagement(
        status,
      );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.roomsService.findOne(
      id,
    );
  }

  @Post()
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(UserRole.ADMIN)
  create(
    @Body()
    dto: CreateRoomDto,
  ) {
    return this.roomsService.create(
      dto,
    );
  }

  @Patch(':id')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,

    @Body()
    dto: UpdateRoomDto,
  ) {
    return this.roomsService.update(
      id,
      dto,
    );
  }

  @Patch(':id/status')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(UserRole.ADMIN)
  updateStatus(
    @Param('id') id: string,

    @Body()
    dto: UpdateRoomStatusDto,
  ) {
    return this.roomsService
      .changeStatus(
        id,
        dto.status,
      );
  }

  @Patch(':id/deactivate')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(UserRole.ADMIN)
  deactivate(
    @Param('id') id: string,
  ) {
    return this.roomsService
      .deactivate(id);
  }

  @Patch(':id/reactivate')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(UserRole.ADMIN)
  reactivate(
    @Param('id') id: string,
  ) {
    return this.roomsService
      .reactivate(id);
  }
}