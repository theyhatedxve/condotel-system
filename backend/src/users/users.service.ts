import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  UserRole,
  UserStatus,
} from '../generated/prisma/enums';

import {
  PrismaService,
} from '../prisma/prisma.service';

// Keep password hashes out of profile and authentication responses.
const publicUserSelect = {
  id: true,

  email: true,
  username: true,

  firstName: true,
  lastName: true,
  phone: true,

  role: true,
  status: true,

  mustChangePassword:
    true,

  lastLoginAt: true,

  createdAt: true,
  updatedAt: true,
} as const;

interface CreateCustomerData {
  email: string;

  username?: string;

  passwordHash: string;

  firstName: string;
  lastName: string;

  phone?: string;
}

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;

  username?:
    | string
    | null;

  phone?:
    | string
    | null;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async findByEmail(
    email: string,
  ) {
    return this.prisma.user
      .findUnique({
        where: {
          email:
            email
              .trim()
              .toLowerCase(),
        },
      });
  }

  async findByUsername(
    username: string,
  ) {
    return this.prisma.user
      .findUnique({
        where: {
          username:
            username
              .trim()
              .toLowerCase(),
        },
      });
  }

  async findByEmailOrUsername(
    identifier: string,
  ) {
    const normalizedIdentifier =
      identifier
        .trim()
        .toLowerCase();

    return this.prisma.user
      .findFirst({
        where: {
          OR: [
            {
              email:
                normalizedIdentifier,
            },
            {
              username:
                normalizedIdentifier,
            },
          ],
        },
      });
  }

  async findById(
    id: string,
  ) {
    return this.prisma.user
      .findUnique({
        where: {
          id,
        },
      });
  }

  async findPublicById(
    id: string,
  ) {
    return this.prisma.user
      .findUnique({
        where: {
          id,
        },

        select:
          publicUserSelect,
      });
  }

  async createCustomer(
    data:
      CreateCustomerData,
  ) {
    return this.prisma.user
      .create({
        data: {
          email:
            data.email
              .trim()
              .toLowerCase(),

          username:
            data.username
              ? data.username
                  .trim()
                  .toLowerCase()
              : null,

          passwordHash:
            data.passwordHash,

          firstName:
            data.firstName
              .trim(),

          lastName:
            data.lastName
              .trim(),

          phone:
            data.phone
              ?.trim() ||
            null,

          role:
            UserRole.CUSTOMER,

          status:
            UserStatus.ACTIVE,

          guestProfile: {
            create: {},
          },
        },

        select:
          publicUserSelect,
      });
  }

  async updateProfile(
    id: string,
    data:
      UpdateProfileData,
  ) {
    const user =
      await this.findById(id);

    if (!user) {
      throw new NotFoundException(
        'User not found.',
      );
    }

    if (
      data.firstName !==
        undefined &&
      !data.firstName.trim()
    ) {
      throw new BadRequestException(
        'First name is required.',
      );
    }

    if (
      data.lastName !==
        undefined &&
      !data.lastName.trim()
    ) {
      throw new BadRequestException(
        'Last name is required.',
      );
    }

    let username:
      | string
      | null
      | undefined;

    if (
      data.username !==
      undefined
    ) {
      username =
        data.username
          ?.trim()
          .toLowerCase() ||
        null;

      if (
        username &&
        username !==
          user.username
      ) {
        const existing =
          await this
            .findByUsername(
              username,
            );

        if (
          existing &&
          existing.id !== id
        ) {
          throw new ConflictException(
            'Username is already taken.',
          );
        }
      }
    }

    return this.prisma.user
      .update({
        where: {
          id,
        },

        data: {
          ...(data.firstName !==
          undefined
            ? {
                firstName:
                  data.firstName
                    .trim(),
              }
            : {}),

          ...(data.lastName !==
          undefined
            ? {
                lastName:
                  data.lastName
                    .trim(),
              }
            : {}),

          ...(data.username !==
          undefined
            ? {
                username,
              }
            : {}),

          ...(data.phone !==
          undefined
            ? {
                phone:
                  data.phone
                    ?.trim() ||
                  null,
              }
            : {}),
        },

        select:
          publicUserSelect,
      });
  }

  async updatePassword(
    id: string,
    passwordHash: string,
    mustChangePassword:
      boolean,
  ) {
    return this.prisma.user
      .update({
        where: {
          id,
        },

        data: {
          passwordHash,

          mustChangePassword,
        },

        select:
          publicUserSelect,
      });
  }

  async updateLastLogin(
    id: string,
  ) {
    return this.prisma.user
      .update({
        where: {
          id,
        },

        data: {
          lastLoginAt:
            new Date(),
        },

        select:
          publicUserSelect,
      });
  }
}