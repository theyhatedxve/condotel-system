import { PrivateDataService } from '../security/private-data.service';
import { publicUserSelect } from '../users/users.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { CreateManagedUserDto } from './create-managed-user.dto';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

import { UserRole } from '../generated/prisma/enums';

import { PrismaService } from '../prisma/prisma.service';

import { ResetUserPasswordDto } from './reset-user-password.dto';

import { UpdateManagedUserDto } from './update-managed-user.dto';

import { UserManagementQueryDto } from './user-management-query.dto';

const managedUserSelect = publicUserSelect;

// Implement user management operations using the injected dependencies and existing
// business rules.
@Injectable()
export class UserManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privacy: PrivateDataService,
  ) {}

  // Prepare encrypted account fields and a hashed temporary password for account
  // creation/import.
  private async creationData(dto: CreateManagedUserDto) {
    if (!dto.firstName.trim() || !dto.lastName.trim())
      throw new BadRequestException('Account name is required.');
    const id = randomUUID();
    const role = dto.role ?? UserRole.CUSTOMER;
    return {
      id,
      ...this.privacy.writeContacts(id, dto),
      username: dto.username?.trim().toLowerCase() || null,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      role,
      passwordHash: await argon2.hash(dto.password, { type: argon2.argon2id }),
      mustChangePassword: true,
      ...(role === UserRole.CUSTOMER ? { guestProfile: { create: {} } } : {}),
    };
  }

  // Count all users by role and suspended status independently of list filters or
  // pagination.
  async summary() {
    const [totalUsers, totalStaff, totalCustomers, totalSuspended] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { role: 'STAFF' } }),
        this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
        this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
      ]);
    return { totalUsers, totalStaff, totalCustomers, totalSuspended };
  }

  // Create an account and its audit entry in one database transaction.
  async create(dto: CreateManagedUserDto, admin: AuthenticatedUser) {
    const data = await this.creationData(dto);
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.user.create({ data, select: managedUserSelect });
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: 'USER_CREATED',
          entityType: 'User',
          entityId: row.id,
        },
      });
      return this.privacy.response(row);
    });
  }

  // Hash temporary passwords sequentially, then save the entire account batch and audit
  // entry atomically.
  async importUsers(users: CreateManagedUserDto[], admin: AuthenticatedUser) {
    // Sequential Argon2 work bounds memory. The database batch is all-or-nothing.
    const records: Awaited<
      ReturnType<UserManagementService['creationData']>
    >[] = [];
    for (const dto of users) records.push(await this.creationData(dto));
    return this.prisma.$transaction(async (tx) => {
      const ids: string[] = [];
      for (const data of records)
        ids.push((await tx.user.create({ data, select: { id: true } })).id);
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: 'USERS_IMPORTED',
          entityType: 'User',
          details: JSON.stringify({ count: ids.length }),
        },
      });
      return { imported: ids.length, ids };
    });
  }

  // List public account fields with role/status/search filters and optional pagination.
  async findAll(query: UserManagementQueryDto) {
    const search = query.search?.trim();

    const rows = await this.prisma.user.findMany({
      where: {
        ...(query.role
          ? {
              role: query.role,
            }
          : {}),

        ...(query.status
          ? {
              status: query.status,
            }
          : {}),

        ...(search
          ? {
              OR: this.privacy.contactSearch(search),
            }
          : {}),
      },

      select: managedUserSelect,

      ...(query.page ? { take: 50, skip: (query.page - 1) * 50 } : {}),

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
    return rows.map((row) => this.privacy.response(row));
  }

  // Load one managed account using the public field selection.
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },

      select: managedUserSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.privacy.response(user);
  }

  // Enforce administrator/self-management safeguards, update validated account fields,
  // and record an audit entry.
  async update(
    id: string,
    dto: UpdateManagedUserDto,
    admin: AuthenticatedUser,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (dto.firstName !== undefined && !dto.firstName.trim()) {
      throw new BadRequestException('First name is required.');
    }

    if (dto.lastName !== undefined && !dto.lastName.trim()) {
      throw new BadRequestException('Last name is required.');
    }

    // Admin cannot change their own
    // role or account status.
    if (
      user.id === admin.id &&
      (dto.role !== undefined || dto.status !== undefined)
    ) {
      throw new BadRequestException(
        'You cannot change your own role or account status.',
      );
    }

    // Protect all Administrator roles/statuses
    // from being changed through this page.
    if (
      user.role === UserRole.ADMIN &&
      (dto.role !== undefined || dto.status !== undefined)
    ) {
      throw new BadRequestException(
        'Administrator role and status cannot be changed from User Management.',
      );
    }

    // We are not allowing someone to
    // promote Staff/Customer into ADMIN.
    if (dto.role === UserRole.ADMIN && user.role !== UserRole.ADMIN) {
      throw new BadRequestException(
        'Promotion to Administrator is not allowed from User Management.',
      );
    }

    let email: string | undefined;

    if (dto.email !== undefined) {
      email = dto.email.trim().toLowerCase();

      const existingEmail = await this.prisma.user.findUnique({
        where: {
          emailBlindIndex: this.privacy.index('email', email),
        },
      });

      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictException('Email address is already registered.');
      }
    }

    let username: string | null | undefined;

    if (dto.username !== undefined) {
      username = dto.username?.trim().toLowerCase() || null;

      if (username) {
        const existingUsername = await this.prisma.user.findUnique({
          where: {
            username,
          },
        });

        if (existingUsername && existingUsername.id !== id) {
          throw new ConflictException('Username is already taken.');
        }
      }
    }

    // Keep role/profile changes and their audit entry atomic to avoid a partially updated account.
    return this.prisma.$transaction(async (transaction) => {
      // If Staff becomes Customer,
      // make sure a GuestProfile exists.
      if (dto.role === UserRole.CUSTOMER) {
        await transaction.guestProfile.upsert({
          where: {
            userId: id,
          },

          update: {},

          create: {
            userId: id,
          },
        });
      }

      const updatedUser = await transaction.user.update({
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

          ...this.privacy.writeContacts(id, { email, phone: dto.phone }),

          ...(dto.username !== undefined
            ? {
                username,
              }
            : {}),

          ...(dto.role !== undefined
            ? {
                role: dto.role,
              }
            : {}),

          ...(dto.status !== undefined
            ? {
                status: dto.status,
              }
            : {}),
        },

        select: managedUserSelect,
      });

      await transaction.auditLog.create({
        data: {
          actorId: admin.id,

          action: 'USER_UPDATED',

          entityType: 'User',

          entityId: id,

          details: JSON.stringify({
            // Record field names rather than copying account values into the audit log.
            updatedFields: Object.keys(dto),
          }),
        },
      });

      return this.privacy.response(updatedUser);
    });
  }

  // Apply password-reset restrictions and save a temporary password hash with its audit
  // entry.
  async resetPassword(
    id: string,
    dto: ResetUserPasswordDto,
    admin: AuthenticatedUser,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Admin changes their own password
    // through My Profile instead.
    if (user.id === admin.id) {
      throw new BadRequestException(
        'Use Change Password for your own administrator account.',
      );
    }

    // Do not allow Admin-to-Admin
    // password resets here.
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException(
        'Administrator passwords cannot be reset from User Management.',
      );
    }

    const samePassword = await argon2.verify(
      user.passwordHash,
      dto.newPassword,
    );

    if (samePassword) {
      throw new BadRequestException(
        'The temporary password must be different from the current password.',
      );
    }

    const passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
    });

    return this.prisma.$transaction(async (transaction) => {
      const updatedUser = await transaction.user.update({
        where: {
          id,
        },

        data: {
          passwordHash,

          // Mark administrator-issued passwords as temporary for the password-change flow.
          mustChangePassword: true,
        },

        select: managedUserSelect,
      });

      await transaction.auditLog.create({
        data: {
          actorId: admin.id,

          action: 'USER_PASSWORD_RESET',

          entityType: 'User',

          entityId: id,

          details: JSON.stringify({
            forceChangeOnNextLogin: true,
          }),
        },
      });

      return {
        message: 'Password reset successfully.',

        user: this.privacy.response(updatedUser),
      };
    });
  }
}
