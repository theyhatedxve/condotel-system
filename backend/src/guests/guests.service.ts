import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as argon2 from 'argon2';

import { UserRole, UserStatus } from '../generated/prisma/enums';

import { PrismaService } from '../prisma/prisma.service';

import { CreateGuestDto } from './create-guest.dto';

import { UpdateGuestDto } from './update-guest.dto';

@Injectable()
export class GuestsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    const normalizedSearch = search?.trim();

    return this.prisma.user.findMany({
      where: {
        role: UserRole.CUSTOMER,

        ...(normalizedSearch
          ? {
              OR: [
                {
                  firstName: {
                    contains: normalizedSearch,
                  },
                },
                {
                  lastName: {
                    contains: normalizedSearch,
                  },
                },
                {
                  email: {
                    contains: normalizedSearch,
                  },
                },
                {
                  username: {
                    contains: normalizedSearch,
                  },
                },
                {
                  phone: {
                    contains: normalizedSearch,
                  },
                },
              ],
            }
          : {}),
      },

      select: {
        id: true,
        email: true,
        username: true,

        firstName: true,
        lastName: true,
        phone: true,

        role: true,
        status: true,

        createdAt: true,
        updatedAt: true,

        guestProfile: true,
      },

      orderBy: [
        {
          lastName: 'asc',
        },
        {
          firstName: 'asc',
        },
      ],
    });
  }

  async findOne(id: string) {
    const guest = await this.prisma.user.findFirst({
      where: {
        id,
        role: UserRole.CUSTOMER,
      },

      select: {
        id: true,
        email: true,
        username: true,

        firstName: true,
        lastName: true,
        phone: true,

        role: true,
        status: true,

        createdAt: true,
        updatedAt: true,

        guestProfile: true,
      },
    });

    if (!guest) {
      throw new NotFoundException('Guest not found.');
    }

    return guest;
  }

  async create(dto: CreateGuestDto) {
    const email = dto.email.trim().toLowerCase();

    const username = dto.username?.trim().toLowerCase();

    const existingEmail = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingEmail) {
      throw new ConflictException('Email address is already registered.');
    }

    if (username) {
      const existingUsername = await this.prisma.user.findUnique({
        where: {
          username,
        },
      });

      if (existingUsername) {
        throw new ConflictException('Username is already taken.');
      }
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    // A guest is a CUSTOMER account plus a profile; the nested write creates both atomically.
    return this.prisma.user.create({
      data: {
        email,

        username: username ?? null,

        passwordHash,

        firstName: dto.firstName.trim(),

        lastName: dto.lastName.trim(),

        phone: dto.phone?.trim() || null,

        role: UserRole.CUSTOMER,

        status: UserStatus.ACTIVE,

        guestProfile: {
          create: {
            address: dto.address?.trim() || null,

            city: dto.city?.trim() || null,

            province: dto.province?.trim() || null,

            postalCode: dto.postalCode?.trim() || null,

            emergencyContactName: dto.emergencyContactName?.trim() || null,

            emergencyContactPhone: dto.emergencyContactPhone?.trim() || null,
          },
        },
      },

      select: {
        id: true,
        email: true,
        username: true,

        firstName: true,
        lastName: true,
        phone: true,

        role: true,
        status: true,

        guestProfile: true,

        createdAt: true,
      },
    });
  }

  async update(id: string, dto: UpdateGuestDto) {
    await this.findOne(id);

    return this.prisma.user.update({
      where: {
        id,
      },

      data: {
        ...(dto.firstName !== undefined
          ? {
              firstName: dto.firstName.trim(),
            }
          : {}),

        ...(dto.lastName !== undefined
          ? {
              lastName: dto.lastName.trim(),
            }
          : {}),

        ...(dto.phone !== undefined
          ? {
              phone: dto.phone.trim() || null,
            }
          : {}),

        guestProfile: {
          upsert: {
            create: {
              address: dto.address?.trim() || null,

              city: dto.city?.trim() || null,

              province: dto.province?.trim() || null,

              postalCode: dto.postalCode?.trim() || null,

              emergencyContactName: dto.emergencyContactName?.trim() || null,

              emergencyContactPhone: dto.emergencyContactPhone?.trim() || null,
            },

            update: {
              ...(dto.address !== undefined
                ? {
                    address: dto.address.trim() || null,
                  }
                : {}),

              ...(dto.city !== undefined
                ? {
                    city: dto.city.trim() || null,
                  }
                : {}),

              ...(dto.province !== undefined
                ? {
                    province: dto.province.trim() || null,
                  }
                : {}),

              ...(dto.postalCode !== undefined
                ? {
                    postalCode: dto.postalCode.trim() || null,
                  }
                : {}),

              ...(dto.emergencyContactName !== undefined
                ? {
                    emergencyContactName:
                      dto.emergencyContactName.trim() || null,
                  }
                : {}),

              ...(dto.emergencyContactPhone !== undefined
                ? {
                    emergencyContactPhone:
                      dto.emergencyContactPhone.trim() || null,
                  }
                : {}),
            },
          },
        },
      },

      select: {
        id: true,
        email: true,
        username: true,

        firstName: true,
        lastName: true,
        phone: true,

        role: true,
        status: true,

        guestProfile: true,

        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
