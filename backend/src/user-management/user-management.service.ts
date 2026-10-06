import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as argon2 from 'argon2';

import type {
  AuthenticatedUser,
} from '../auth/interfaces/authenticated-user.interface';

import {
  UserRole,
} from '../generated/prisma/enums';

import {
  PrismaService,
} from '../prisma/prisma.service';

import {
  ResetUserPasswordDto,
} from './reset-user-password.dto';

import {
  UpdateManagedUserDto,
} from './update-managed-user.dto';

import {
  UserManagementQueryDto,
} from './user-management-query.dto';

const managedUserSelect = {
  id: true,

  email: true,
  username: true,

  firstName: true,
  lastName: true,
  phone: true,

  role: true,
  status: true,

  mustChangePassword: true,

  lastLoginAt: true,

  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UserManagementService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async findAll(
    query:
      UserManagementQueryDto,
  ) {
    const search =
      query.search
        ?.trim();

    return this.prisma.user.findMany({
      where: {
        ...(query.role
          ? {
              role:
                query.role,
            }
          : {}),

        ...(query.status
          ? {
              status:
                query.status,
            }
          : {}),

        ...(search
          ? {
              OR: [
                {
                  firstName: {
                    contains:
                      search,
                  },
                },

                {
                  lastName: {
                    contains:
                      search,
                  },
                },

                {
                  email: {
                    contains:
                      search,
                  },
                },

                {
                  username: {
                    contains:
                      search,
                  },
                },

                {
                  phone: {
                    contains:
                      search,
                  },
                },
              ],
            }
          : {}),
      },

      select:
        managedUserSelect,

      orderBy: [
        {
          role: 'asc',
        },

        {
          lastName: 'asc',
        },

        {
          firstName: 'asc',
        },
      ],
    });
  }

  async findOne(
    id: string,
  ) {
    const user =
      await this.prisma.user
        .findUnique({
          where: {
            id,
          },

          select:
            managedUserSelect,
        });

    if (!user) {
      throw new NotFoundException(
        'User not found.',
      );
    }

    return user;
  }

  async update(
    id: string,
    dto:
      UpdateManagedUserDto,
    admin:
      AuthenticatedUser,
  ) {
    const user =
      await this.prisma.user
        .findUnique({
          where: {
            id,
          },
        });

    if (!user) {
      throw new NotFoundException(
        'User not found.',
      );
    }

    if (
      dto.firstName !==
        undefined &&
      !dto.firstName.trim()
    ) {
      throw new BadRequestException(
        'First name is required.',
      );
    }

    if (
      dto.lastName !==
        undefined &&
      !dto.lastName.trim()
    ) {
      throw new BadRequestException(
        'Last name is required.',
      );
    }

    // Admin cannot change their own
    // role or account status.
    if (
      user.id ===
        admin.id &&
      (
        dto.role !==
          undefined ||
        dto.status !==
          undefined
      )
    ) {
      throw new BadRequestException(
        'You cannot change your own role or account status.',
      );
    }

    // Protect all Administrator roles/statuses
    // from being changed through this page.
    if (
      user.role ===
        UserRole.ADMIN &&
      (
        dto.role !==
          undefined ||
        dto.status !==
          undefined
      )
    ) {
      throw new BadRequestException(
        'Administrator role and status cannot be changed from User Management.',
      );
    }

    // We are not allowing someone to
    // promote Staff/Customer into ADMIN.
    if (
      dto.role ===
        UserRole.ADMIN &&
      user.role !==
        UserRole.ADMIN
    ) {
      throw new BadRequestException(
        'Promotion to Administrator is not allowed from User Management.',
      );
    }

    let email:
      | string
      | undefined;

    if (
      dto.email !==
      undefined
    ) {
      email =
        dto.email
          .trim()
          .toLowerCase();

      const existingEmail =
        await this.prisma.user
          .findUnique({
            where: {
              email,
            },
          });

      if (
        existingEmail &&
        existingEmail.id !==
          id
      ) {
        throw new ConflictException(
          'Email address is already registered.',
        );
      }
    }

    let username:
      | string
      | null
      | undefined;

    if (
      dto.username !==
      undefined
    ) {
      username =
        dto.username
          ?.trim()
          .toLowerCase() ||
        null;

      if (username) {
        const existingUsername =
          await this.prisma.user
            .findUnique({
              where: {
                username,
              },
            });

        if (
          existingUsername &&
          existingUsername.id !==
            id
        ) {
          throw new ConflictException(
            'Username is already taken.',
          );
        }
      }
    }

    return this.prisma
      .$transaction(
        async (
          transaction,
        ) => {
          // If Staff becomes Customer,
          // make sure a GuestProfile exists.
          if (
            dto.role ===
            UserRole.CUSTOMER
          ) {
            await transaction
              .guestProfile
              .upsert({
                where: {
                  userId:
                    id,
                },

                update: {},

                create: {
                  userId:
                    id,
                },
              });
          }

          const updatedUser =
            await transaction
              .user
              .update({
                where: {
                  id,
                },

                data: {
                  ...(dto.firstName !==
                  undefined
                    ? {
                        firstName:
                          dto.firstName
                            .trim(),
                      }
                    : {}),

                  ...(dto.lastName !==
                  undefined
                    ? {
                        lastName:
                          dto.lastName
                            .trim(),
                      }
                    : {}),

                  ...(email !==
                  undefined
                    ? {
                        email,
                      }
                    : {}),

                  ...(dto.username !==
                  undefined
                    ? {
                        username,
                      }
                    : {}),

                  ...(dto.phone !==
                  undefined
                    ? {
                        phone:
                          dto.phone
                            ?.trim() ||
                          null,
                      }
                    : {}),

                  ...(dto.role !==
                  undefined
                    ? {
                        role:
                          dto.role,
                      }
                    : {}),

                  ...(dto.status !==
                  undefined
                    ? {
                        status:
                          dto.status,
                      }
                    : {}),
                },

                select:
                  managedUserSelect,
              });

          await transaction.auditLog
            .create({
              data: {
                actorId:
                  admin.id,

                action:
                  'USER_UPDATED',

                entityType:
                  'User',

                entityId:
                  id,

                details:
                  JSON.stringify({
                    updatedFields:
                      Object.keys(
                        dto,
                      ),
                  }),
              },
            });

          return updatedUser;
        },
      );
  }

  async resetPassword(
    id: string,
    dto:
      ResetUserPasswordDto,
    admin:
      AuthenticatedUser,
  ) {
    const user =
      await this.prisma.user
        .findUnique({
          where: {
            id,
          },
        });

    if (!user) {
      throw new NotFoundException(
        'User not found.',
      );
    }

    // Admin changes their own password
    // through My Profile instead.
    if (
      user.id ===
      admin.id
    ) {
      throw new BadRequestException(
        'Use Change Password for your own administrator account.',
      );
    }

    // Do not allow Admin-to-Admin
    // password resets here.
    if (
      user.role ===
      UserRole.ADMIN
    ) {
      throw new BadRequestException(
        'Administrator passwords cannot be reset from User Management.',
      );
    }

    const samePassword =
      await argon2.verify(
        user.passwordHash,
        dto.newPassword,
      );

    if (samePassword) {
      throw new BadRequestException(
        'The temporary password must be different from the current password.',
      );
    }

    const passwordHash =
      await argon2.hash(
        dto.newPassword,
        {
          type:
            argon2.argon2id,
        },
      );

    return this.prisma
      .$transaction(
        async (
          transaction,
        ) => {
          const updatedUser =
            await transaction.user
              .update({
                where: {
                  id,
                },

                data: {
                  passwordHash,

                  mustChangePassword:
                    true,
                },

                select:
                  managedUserSelect,
              });

          await transaction.auditLog
            .create({
              data: {
                actorId:
                  admin.id,

                action:
                  'USER_PASSWORD_RESET',

                entityType:
                  'User',

                entityId:
                  id,

                details:
                  JSON.stringify({
                    forceChangeOnNextLogin:
                      true,
                  }),
              },
            });

          return {
            message:
              'Password reset successfully.',

            user:
              updatedUser,
          };
        },
      );
  }
}