import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import {
  ReservationStatus,
  RoomStatus,
  UserRole,
  UserStatus,
} from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import {
  PrivateDataService,
  contactSelect,
} from '../security/private-data.service';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AvailabilityQueryDto } from './availability-query.dto';
import { CreateReservationDto } from './create-reservation.dto';
import { ReservationQueryDto } from './reservation-query.dto';
import { UpdateReservationNotesDto } from './update-reservation-notes.dto';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService } from '../notifications/notifications.service';

const BLOCKING_STATUSES = [
  ReservationStatus.PENDING,
  ReservationStatus.CONFIRMED,
  ReservationStatus.CHECKED_IN,
];
const relations = {
  guest: {
    select: { id: true, firstName: true, lastName: true, ...contactSelect },
  },
  room: true,
  payments: { select: { id: true, status: true, amountCentavos: true } },
} as const;

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privacy: PrivateDataService,
    private readonly paymentsService: PaymentsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private parseDates(checkInValue: string, checkOutValue: string) {
    const checkIn = new Date(checkInValue),
      checkOut = new Date(checkOutValue);
    if (
      !Number.isFinite(checkIn.getTime()) ||
      !Number.isFinite(checkOut.getTime()) ||
      checkOut <= checkIn ||
      !Number.isInteger((checkOut.getTime() - checkIn.getTime()) / 86400000) ||
      !checkInValue.startsWith(checkIn.toISOString().slice(0, 10)) ||
      !checkOutValue.startsWith(checkOut.toISOString().slice(0, 10))
    ) {
      throw new BadRequestException(
        'Choose valid check-in and check-out dates at least one night apart.',
      );
    }
    return { checkIn, checkOut };
  }
  private overlap(roomId: string, checkIn: Date, checkOut: Date) {
    return {
      roomId,
      status: { in: BLOCKING_STATUSES },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    };
  }
  private ensureAccess(guestId: string, user: AuthenticatedUser) {
    if (user.role === UserRole.CUSTOMER && guestId !== user.id)
      throw new ForbiddenException('You cannot access this reservation.');
  }
  private withArrival(notes: string | null, arrival?: string) {
    return arrival
      ? [notes, 'Estimated arrival: ' + arrival]
          .filter((value) => value !== null && value !== '')
          .join('\n')
      : notes;
  }
  async findAvailableRooms(dto: AvailabilityQueryDto) {
    const { checkIn, checkOut } = this.parseDates(dto.checkIn, dto.checkOut);
    return this.prisma.room.findMany({
      where: {
        isActive: true,
        status: { not: RoomStatus.MAINTENANCE },
        ...(dto.capacity ? { capacity: { gte: dto.capacity } } : {}),
        reservations: {
          none: {
            status: { in: BLOCKING_STATUSES },
            checkIn: { lt: checkOut },
            checkOut: { gt: checkIn },
          },
        },
      },
      orderBy: { roomNumber: 'asc' },
    });
  }
  async findAll(query: ReservationQueryDto) {
    const rows = await this.prisma.reservation.findMany({
      ...(query.page ? {take:50,skip:(query.page-1)*50} : {}),
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.guestId ? { guestId: query.guestId } : {}),
        ...(query.roomId ? { roomId: query.roomId } : {}),
      },
      include: relations,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });
    return rows.map((row) => this.privacy.response(row));
  }
  async findMine(userId: string) {
    const rows = await this.prisma.reservation.findMany({
      where: { guestId: userId },
      include: {
        room: true,
        payments: { select: { id: true, status: true, amountCentavos: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.privacy.response(row));
  }
  private async stored(id: string) {
    const row = await this.prisma.reservation.findUnique({
      where: { id },
      include: relations,
    });
    if (!row) throw new NotFoundException('Reservation not found.');
    return row;
  }
  async findOneAuthorized(id: string, user: AuthenticatedUser) {
    const row = await this.stored(id);
    this.ensureAccess(row.guestId, user);
    return this.privacy.response(row);
  }
  async create(user: AuthenticatedUser, dto: CreateReservationDto) {
    const guestId = user.role === UserRole.CUSTOMER ? user.id : dto.guestId;
    if (!guestId) throw new BadRequestException('A guest is required.');
    const { checkIn, checkOut } = this.parseDates(dto.checkIn, dto.checkOut);
    const today = new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10);
    if (checkIn.toISOString().slice(0, 10) < today)
      throw new BadRequestException('Check-in cannot be in the past.');
    const id = randomUUID();
    const encrypted = this.privacy.writeNotes(
      id,
      this.withArrival(
        dto.specialRequests?.trim() || null,
        dto.estimatedArrival,
      ),
    );
    const row = await this.prisma.$transaction(async (tx) => {
      const guest = await tx.user.findFirst({
        where: {
          id: guestId,
          role: UserRole.CUSTOMER,
          status: UserStatus.ACTIVE,
        },
        select: { id: true },
      });
      if (!guest)
        throw new BadRequestException('Selected guest is unavailable.');
      const room = await tx.room.findUnique({ where: { id: dto.roomId } });
      if (!room) throw new NotFoundException('Room not found.');
      if (!room.isActive || room.status === RoomStatus.MAINTENANCE)
        throw new BadRequestException('Room is unavailable.');
      const children = dto.children ?? 0;
      if (
        !Number.isInteger(dto.adults) ||
        dto.adults < 1 ||
        !Number.isInteger(children) ||
        children < 0 ||
        dto.adults + children > room.capacity
      )
        throw new BadRequestException('Guest count exceeds room capacity.');
      if (
        await tx.reservation.findFirst({
          where: this.overlap(room.id, checkIn, checkOut),
          select: { id: true },
        })
      )
        throw new ConflictException(
          'Room is not available for the selected dates.',
        );
      return tx.reservation.create({
        data: {
          id,
          referenceNo:
            'RES-' +
            today.replaceAll('-', '') +
            '-' +
            randomBytes(6).toString('hex').toUpperCase(),
          guestId,
          roomId: room.id,
          createdById: user.id,
          checkIn,
          checkOut,
          adults: dto.adults,
          children,
          totalAmountCentavos:
            ((checkOut.getTime() - checkIn.getTime()) / 86400000) *
            room.ratePerNightCentavos,
          status: ReservationStatus.PENDING,
          ...encrypted,
        },
        include: relations,
      });
    });
    await this.notificationsService.notifyReservationCreated({
      reservationId: row.id,
      referenceNo: row.referenceNo,
      guestName: row.guest.firstName + ' ' + row.guest.lastName,
      roomNumber: row.room.roomNumber,
    });
    return this.privacy.response(row);
  }
  async updateNotes(
    id: string,
    user: AuthenticatedUser,
    dto: UpdateReservationNotesDto,
  ) {
    const row = await this.stored(id);
    this.ensureAccess(row.guestId, user);
    if (row.status === 'CANCELLED' || row.status === 'CHECKED_OUT')
      throw new BadRequestException(
        'This reservation can no longer be edited.',
      );
    // Omitted notes preserve the stored text; null explicitly clears it.
    const notes =
      dto.specialRequests === undefined
        ? this.privacy.readField('Reservation', id, 'specialRequests', row)
        : dto.specialRequests;
    if (dto.specialRequests === undefined && dto.estimatedArrival === undefined)
      return this.privacy.response(row);
    const data = this.privacy.writeNotes(
      id,
      this.withArrival(notes, dto.estimatedArrival),
    );
    const updated = await this.prisma.reservation.updateMany({
      where: { id, status: row.status },
      data,
    });
    if (!updated.count)
      throw new ConflictException(
        'Reservation changed. Reload before editing.',
      );
    return this.findOneAuthorized(id, user);
  }
  async updateStatus(id: string, newStatus: ReservationStatus) {
    const row = await this.stored(id);
    if (newStatus === 'CANCELLED') return this.cancelStored(row);
    const allowed =
      (row.status === 'CONFIRMED' && newStatus === 'CHECKED_IN') ||
      (row.status === 'CHECKED_IN' && newStatus === 'CHECKED_OUT');
    if (!allowed || !row.payments.some((payment) => payment.status === 'PAID'))
      throw new BadRequestException(
        'This transition requires a verified paid reservation.',
      );
    const updated = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.reservation.updateMany({
        where: { id, status: row.status },
        data: { status: newStatus },
      });
      if (!changed.count)
        throw new ConflictException(
          'Reservation changed. Reload before updating.',
        );
      if (newStatus === 'CHECKED_IN') {
        if (
          await tx.reservation.count({
            where: {
              roomId: row.roomId,
              status: 'CHECKED_IN',
              id: { not: id },
            },
          })
        )
          throw new ConflictException('Room already has a checked-in guest.');
        await tx.room.update({
          where: { id: row.roomId },
          data: { status: 'OCCUPIED' },
        });
      } else {
        const occupied = await tx.reservation.count({
          where: { roomId: row.roomId, status: 'CHECKED_IN' },
        });
        if (!occupied)
          await tx.room.updateMany({
            where: { id: row.roomId, status: 'OCCUPIED' },
            data: { status: 'AVAILABLE' },
          });
      }
      return tx.reservation.findUniqueOrThrow({
        where: { id },
        include: relations,
      });
    });
    return this.privacy.response(updated);
  }
  private async cancelStored(
    row: Awaited<ReturnType<ReservationsService['stored']>>,
  ) {
    if (!['PENDING', 'CONFIRMED'].includes(row.status))
      throw new BadRequestException(
        'This reservation can no longer be cancelled.',
      );
    if (row.payments.some((payment) => payment.status === 'PAID'))
      throw new BadRequestException(
        'Paid reservations require staff payment/refund review.',
      );
    // Reconcile any existing hosted session before cancelling and releasing availability.
    await this.paymentsService.cancelPendingPaymentsForReservation(row.id);
    const cancelled = await this.prisma.$transaction(async (tx) => {
      if (
        await tx.payment.count({
          where: { reservationId: row.id, status: 'PAID' },
        })
      )
        throw new ConflictException(
          'Payment was received. Reload the booking.',
        );
      const result = await tx.reservation.updateMany({
        where: { id: row.id, status: row.status },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      });
      if (!result.count)
        throw new ConflictException(
          'Reservation changed. Reload before cancelling.',
        );
      return tx.reservation.findUniqueOrThrow({
        where: { id: row.id },
        include: relations,
      });
    });
    await this.notificationsService.notifyReservationCancelled({
      reservationId: row.id,
      referenceNo: row.referenceNo,
      guestName: row.guest.firstName + ' ' + row.guest.lastName,
    });
    return this.privacy.response(cancelled);
  }
  async cancel(id: string, user: AuthenticatedUser) {
    const row = await this.stored(id);
    this.ensureAccess(row.guestId, user);
    return this.cancelStored(row);
  }
}
