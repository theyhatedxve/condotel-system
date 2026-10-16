import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { UserRole, UserStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import {
  PrivateDataService,
  contactSelect,
} from '../security/private-data.service';

export const publicUserSelect = {
  id: true,
  ...contactSelect,
  username: true,
  firstName: true,
  lastName: true,
  role: true,
  status: true,
  mustChangePassword: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;
// Describe the create customer data data shared by the surrounding code.
interface CreateCustomerData {
  email: string;
  username?: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
}
// Describe the update profile data data shared by the surrounding code.
interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  username?: string | null;
  email?: string;
  phone?: string | null;
}

// Implement users operations using the injected dependencies and existing business
// rules.
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privacy: PrivateDataService,
  ) {}
  // Authentication reads hashes internally but does not decrypt contacts before password validation.
  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { emailBlindIndex: this.privacy.index('email', email) },
    });
  }
  // Find an internal account using its normalized username.
  findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() },
    });
  }
  // Resolve either login identifier without decrypting contacts before password
  // verification.
  findByEmailOrUsername(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { emailBlindIndex: this.privacy.index('email', identifier) },
          { username: identifier.trim().toLowerCase() },
        ],
      },
    });
  }
  // Load the internal account, including its hash, for trusted service operations.
  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
  // Select public account fields and decrypt authorized contact fields for the response.
  async findPublicById(id: string) {
    const row = await this.prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });
    return row ? this.privacy.response(row) : null;
  }
  // Create a customer with encrypted contacts and an empty guest profile.
  async createCustomer(data: CreateCustomerData) {
    const id = randomUUID();
    return this.privacy.response(
      await this.prisma.user.create({
        data: {
          id,
          ...this.privacy.writeContacts(id, data),
          username: data.username?.trim().toLowerCase() || null,
          passwordHash: data.passwordHash,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          role: UserRole.CUSTOMER,
          status: UserStatus.ACTIVE,
          guestProfile: { create: {} },
        },
        select: publicUserSelect,
      }),
    );
  }
  // Check editable identifiers and names, then update the account with encrypted contact
  // values.
  async updateProfile(id: string, data: UpdateProfileData) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found.');
    if (data.firstName !== undefined && !data.firstName.trim())
      throw new BadRequestException('First name is required.');
    if (data.lastName !== undefined && !data.lastName.trim())
      throw new BadRequestException('Last name is required.');
    const username = data.username?.trim().toLowerCase() || null;
    if (data.username !== undefined && username) {
      const existing = await this.findByUsername(username);
      if (existing && existing.id !== id)
        throw new ConflictException('Username is already taken.');
    }
    if (data.email !== undefined) {
      const existing = await this.findByEmail(data.email);
      if (existing && existing.id !== id)
        throw new ConflictException('Email address is already registered.');
    }
    return this.privacy.response(
      await this.prisma.user.update({
        where: { id },
        data: {
          ...this.privacy.writeContacts(id, data),
          ...(data.firstName !== undefined
            ? { firstName: data.firstName.trim() }
            : {}),
          ...(data.lastName !== undefined
            ? { lastName: data.lastName.trim() }
            : {}),
          ...(data.username !== undefined ? { username } : {}),
        },
        select: publicUserSelect,
      }),
    );
  }
  // Store the supplied password hash and its temporary-password flag.
  async updatePassword(
    id: string,
    passwordHash: string,
    mustChangePassword: boolean,
  ) {
    return this.privacy.response(
      await this.prisma.user.update({
        where: { id },
        data: { passwordHash, mustChangePassword },
        select: publicUserSelect,
      }),
    );
  }
  // Record the login timestamp without returning private account data.
  async updateLastLogin(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
      select: { id: true },
    });
  }
}
