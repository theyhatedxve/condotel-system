import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  RoomStatus,
} from '../generated/prisma/enums';

import {
  PrismaService,
} from '../prisma/prisma.service';

import {
  CreateRoomDto,
} from './dto/create-room.dto';

import {
  UpdateRoomDto,
} from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll(
    status?: RoomStatus,
  ) {
    return this.prisma.room.findMany({
      where: {
        isActive: true,

        ...(status
          ? {
              status,
            }
          : {}),
      },

      orderBy: {
        roomNumber: 'asc',
      },
    });
  }

  async findAllForManagement(
    status?: RoomStatus,
  ) {
    return this.prisma.room.findMany({
      where: {
        ...(status
          ? {
              status,
            }
          : {}),
      },

      orderBy: [
        {
          isActive: 'desc',
        },
        {
          roomNumber: 'asc',
        },
      ],
    });
  }

  async findOne(id: string) {
    const room =
      await this.prisma.room.findUnique({
        where: {
          id,
        },
      });

    if (!room) {
      throw new NotFoundException(
        'Room not found.',
      );
    }

    return room;
  }

  async create(dto: CreateRoomDto) {
    const existingRoom =
      await this.prisma.room.findUnique({
        where: {
          roomNumber: dto.roomNumber,
        },
      });

    if (existingRoom) {
      throw new ConflictException(
        'Room number already exists.',
      );
    }

    return this.prisma.room.create({
      data: {
        roomNumber:
          dto.roomNumber,

        name:
          dto.name,

        roomType:
          dto.roomType,

        description:
          dto.description ?? null,

        floor:
          dto.floor ?? null,

        capacity:
          dto.capacity,

        ratePerNightCentavos:
          dto.ratePerNightCentavos,

        status:
          dto.status ??
          RoomStatus.AVAILABLE,

        imageUrl:
          dto.imageUrl ?? null,

        isActive:
          dto.isActive ?? true,
      },
    });
  }

  async update(
    id: string,
    dto: UpdateRoomDto,
  ) {
    const room =
      await this.findOne(id);

    if (
      dto.roomNumber &&
      dto.roomNumber !==
        room.roomNumber
    ) {
      const existingRoom =
        await this.prisma.room.findUnique({
          where: {
            roomNumber:
              dto.roomNumber,
          },
        });

      if (
        existingRoom &&
        existingRoom.id !== id
      ) {
        throw new ConflictException(
          'Room number already exists.',
        );
      }
    }

    return this.prisma.room.update({
      where: {
        id,
      },

      data: {
        ...(dto.roomNumber !==
        undefined
          ? {
              roomNumber:
                dto.roomNumber,
            }
          : {}),

        ...(dto.name !== undefined
          ? {
              name: dto.name,
            }
          : {}),

        ...(dto.roomType !== undefined
          ? {
              roomType:
                dto.roomType,
            }
          : {}),

        ...(dto.description !==
        undefined
          ? {
              description:
                dto.description ??
                null,
            }
          : {}),

        ...(dto.floor !== undefined
          ? {
              floor:
                dto.floor ?? null,
            }
          : {}),

        ...(dto.capacity !== undefined
          ? {
              capacity:
                dto.capacity,
            }
          : {}),

        ...(dto.ratePerNightCentavos !==
        undefined
          ? {
              ratePerNightCentavos:
                dto.ratePerNightCentavos,
            }
          : {}),

        ...(dto.status !== undefined
          ? {
              status:
                dto.status,
            }
          : {}),

        ...(dto.imageUrl !== undefined
          ? {
              imageUrl:
                dto.imageUrl ??
                null,
            }
          : {}),

        ...(dto.isActive !== undefined
          ? {
              isActive:
                dto.isActive,
            }
          : {}),
      },
    });
  }

  async changeStatus(
    id: string,
    status: RoomStatus,
  ) {
    await this.findOne(id);

    return this.prisma.room.update({
      where: {
        id,
      },

      data: {
        status,
      },
    });
  }

  async deactivate(id: string) {
    const room =
      await this.findOne(id);

    if (!room.isActive) {
      return room;
    }

    return this.prisma.room.update({
      where: {
        id,
      },

      data: {
        isActive: false,
      },
    });
  }

  async reactivate(id: string) {
    await this.findOne(id);

    return this.prisma.room.update({
      where: {
        id,
      },

      data: {
        isActive: true,
      },
    });
  }
}