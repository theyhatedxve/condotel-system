import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as argon2 from 'argon2';
import { UserRole, UserStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { PrivateDataService } from '../security/private-data.service';
import { publicUserSelect } from '../users/users.service';
import { CreateGuestDto } from './create-guest.dto';
import { UpdateGuestDto } from './update-guest.dto';
const guestSelect = { ...publicUserSelect, guestProfile: true } as const;

@Injectable()
export class GuestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privacy: PrivateDataService,
  ) {}
  async findAll(search?: string, page?: number, status?: UserStatus) {
    const q = search?.trim();
    const rows = await this.prisma.user.findMany({
      where: {
        role: UserRole.CUSTOMER,
        ...(status ? { status } : {}),
        ...(q ? { OR: this.privacy.contactSearch(q) } : {}),
      },
      select: guestSelect,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }, { id: 'asc' }],
      ...(page ? { take: 50, skip: (page - 1) * 50 } : {}),
    });
    return rows.map((row) => this.privacy.response(row));
  }
  async findOne(id: string) {
    const row = await this.prisma.user.findFirst({
      where: { id, role: UserRole.CUSTOMER },
      select: guestSelect,
    });
    if (!row) throw new NotFoundException('Guest not found.');
    return this.privacy.response(row);
  }
  async create(dto: CreateGuestDto) {
    const existing = await this.prisma.user.findUnique({
      where: { emailBlindIndex: this.privacy.index('email', dto.email) },
      select: { id: true },
    });
    if (existing)
      throw new ConflictException('Email address is already registered.');
    const username = dto.username?.trim().toLowerCase() || null;
    if (
      username &&
      (await this.prisma.user.findUnique({
        where: { username },
        select: { id: true },
      }))
    )
      throw new ConflictException('Username is already taken.');
    if (!dto.firstName.trim() || !dto.lastName.trim())
      throw new BadRequestException('Guest name is required.');
    const id = randomUUID();
    const row = await this.prisma.user.create({
      data: {
        id,
        ...this.privacy.writeContacts(id, dto),
        username,
        passwordHash: await argon2.hash(dto.password, {
          type: argon2.argon2id,
        }),
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        mustChangePassword: true,
        guestProfile: { create: this.privacy.writeProfile(id, dto) },
      },
      select: guestSelect,
    });
    return this.privacy.response(row);
  }
  async update(id: string, dto: UpdateGuestDto) {
    await this.findOne(id);
    if (
      (dto.firstName !== undefined && !dto.firstName.trim()) ||
      (dto.lastName !== undefined && !dto.lastName.trim())
    )
      throw new BadRequestException('Guest name is required.');
    if (dto.email !== undefined) {
      const duplicate = await this.prisma.user.findUnique({
        where: { emailBlindIndex: this.privacy.index('email', dto.email) },
        select: { id: true },
      });
      if (duplicate && duplicate.id !== id)
        throw new ConflictException('Email address is already registered.');
    }
    const row = await this.prisma.user.update({
      where: { id },
      data: {
        ...this.privacy.writeContacts(id, dto),
        ...(dto.firstName !== undefined
          ? { firstName: dto.firstName.trim() }
          : {}),
        ...(dto.lastName !== undefined
          ? { lastName: dto.lastName.trim() }
          : {}),
        guestProfile: {
          upsert: {
            create: this.privacy.writeProfile(id, dto),
            update: this.privacy.writeProfile(id, dto),
          },
        },
      },
      select: guestSelect,
    });
    return this.privacy.response(row);
  }
}
