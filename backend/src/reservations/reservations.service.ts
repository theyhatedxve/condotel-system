import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  randomBytes,
} from 'node:crypto';

import {
  ReservationStatus,
  RoomStatus,
  UserRole,
  UserStatus,
} from '../generated/prisma/enums';

import {
  PrismaService,
} from '../prisma/prisma.service';

import {
  AuthenticatedUser,
} from '../auth/interfaces/authenticated-user.interface';

import {
  AvailabilityQueryDto,
} from './dto/availability-query.dto';

import {
  CreateReservationDto,
} from './dto/create-reservation.dto';

import {
  ReservationQueryDto,
} from './dto/reservation-query.dto';

import {
  PaymentsService,
} from '../payments/payments.service';

import {
  NotificationsService,
} from '../notifications/notifications.service';

const BLOCKING_STATUSES = [
  ReservationStatus.PENDING,
  ReservationStatus.CONFIRMED,
  ReservationStatus.CHECKED_IN,
];

@Injectable()
export class ReservationsService {
  constructor(
  private readonly prisma:
    PrismaService,

  private readonly paymentsService:
    PaymentsService,

  private readonly notificationsService:
    NotificationsService,
) {}

  private parseDates(
    checkInValue: string,
    checkOutValue: string,
  ) {
    const checkIn =
      new Date(checkInValue);

    const checkOut =
      new Date(checkOutValue);

    if (
      Number.isNaN(
        checkIn.getTime(),
      ) ||
      Number.isNaN(
        checkOut.getTime(),
      )
    ) {
      throw new BadRequestException(
        'Invalid reservation dates.',
      );
    }

    if (
      checkOut.getTime() <=
      checkIn.getTime()
    ) {
      throw new BadRequestException(
        'Check-out must be after check-in.',
      );
    }

    return {
      checkIn,
      checkOut,
    };
  }

  private calculateNights(
    checkIn: Date,
    checkOut: Date,
  ) {
    const millisecondsPerDay =
      24 * 60 * 60 * 1000;

    return Math.ceil(
      (checkOut.getTime() -
        checkIn.getTime()) /
        millisecondsPerDay,
    );
  }

  private async generateReferenceNo() {
    for (
      let attempt = 0;
      attempt < 5;
      attempt += 1
    ) {
      const datePart =
        new Date()
          .toISOString()
          .slice(0, 10)
          .replaceAll('-', '');

      const randomPart =
        randomBytes(3)
          .toString('hex')
          .toUpperCase();

      const referenceNo =
        `RES-${datePart}-${randomPart}`;

      const existing =
        await this.prisma
          .reservation
          .findUnique({
            where: {
              referenceNo,
            },
          });

      if (!existing) {
        return referenceNo;
      }
    }

    throw new Error(
      'Unable to generate reservation reference number.',
    );
  }

  async findAvailableRooms(
    dto: AvailabilityQueryDto,
  ) {
    const {
      checkIn,
      checkOut,
    } = this.parseDates(
      dto.checkIn,
      dto.checkOut,
    );

    return this.prisma.room.findMany({
      where: {
        isActive: true,

        status: {
          not:
            RoomStatus.MAINTENANCE,
        },

        ...(dto.capacity
          ? {
              capacity: {
                gte: dto.capacity,
              },
            }
          : {}),

        reservations: {
          none: {
            status: {
              in:
                BLOCKING_STATUSES,
            },

            checkIn: {
              lt: checkOut,
            },

            checkOut: {
              gt: checkIn,
            },
          },
        },
      },

      orderBy: {
        roomNumber: 'asc',
      },
    });
  }

  async findAll(
    query: ReservationQueryDto,
  ) {
    return this.prisma
      .reservation
      .findMany({
        where: {
          ...(query.status
            ? {
                status:
                  query.status,
              }
            : {}),

          ...(query.guestId
            ? {
                guestId:
                  query.guestId,
              }
            : {}),

          ...(query.roomId
            ? {
                roomId:
                  query.roomId,
              }
            : {}),
        },

        include: {
          guest: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },

          room: true,

          payments: {
            select: {
              id: true,
              status: true,
              amountCentavos: true,
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      });
  }

  async findMine(
    userId: string,
  ) {
    return this.prisma
      .reservation
      .findMany({
        where: {
          guestId: userId,
        },

        include: {
          room: true,

          payments: {
            select: {
              id: true,
              status: true,
              amountCentavos: true,
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      });
  }

  async findOne(id: string) {
    const reservation =
      await this.prisma
        .reservation
        .findUnique({
          where: {
            id,
          },

          include: {
            guest: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },

            room: true,

            payments: true,
          },
        });

    if (!reservation) {
      throw new NotFoundException(
        'Reservation not found.',
      );
    }

    return reservation;
  }

  async create(
    user: AuthenticatedUser,
    dto: CreateReservationDto,
  ) {
    const guestId =
      user.role ===
      UserRole.CUSTOMER
        ? user.id
        : dto.guestId;

    if (!guestId) {
      throw new BadRequestException(
        'A guest is required.',
      );
    }

    const guest =
      await this.prisma.user
        .findFirst({
          where: {
            id: guestId,
            role:
              UserRole.CUSTOMER,
            status:
              UserStatus.ACTIVE,
          },
        });

    if (!guest) {
      throw new BadRequestException(
        'Selected guest is unavailable.',
      );
    }

    const room =
      await this.prisma.room
        .findUnique({
          where: {
            id: dto.roomId,
          },
        });

    if (!room) {
      throw new NotFoundException(
        'Room not found.',
      );
    }

    if (!room.isActive) {
      throw new BadRequestException(
        'Room is inactive.',
      );
    }

    if (
      room.status ===
      RoomStatus.MAINTENANCE
    ) {
      throw new BadRequestException(
        'Room is currently under maintenance.',
      );
    }

    const children =
      dto.children ?? 0;

    const totalGuests =
      dto.adults + children;

    if (
      totalGuests >
      room.capacity
    ) {
      throw new BadRequestException(
        `Room capacity is ${room.capacity} guest(s).`,
      );
    }

    const {
      checkIn,
      checkOut,
    } = this.parseDates(
      dto.checkIn,
      dto.checkOut,
    );

    const conflictingReservation =
      await this.prisma
        .reservation
        .findFirst({
          where: {
            roomId:
              room.id,

            status: {
              in:
                BLOCKING_STATUSES,
            },

            checkIn: {
              lt: checkOut,
            },

            checkOut: {
              gt: checkIn,
            },
          },
        });

    if (conflictingReservation) {
      throw new BadRequestException(
        'Room is not available for the selected dates.',
      );
    }

    const nights =
      this.calculateNights(
        checkIn,
        checkOut,
      );

    const totalAmountCentavos =
      nights *
      room.ratePerNightCentavos;

    const referenceNo =
      await this.generateReferenceNo();

    const createdReservation =
    await this.prisma
      .reservation
      .create({
        data: {
          referenceNo,

          guestId,

          roomId:
            room.id,

          createdById:
            user.id,

          checkIn,
          checkOut,

          adults:
            dto.adults,

          children,

          totalAmountCentavos,

          status:
            ReservationStatus.PENDING,

          specialRequests:
            dto.specialRequests
              ?.trim() ||
            null,
        },

        include: {
          guest: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },

          room: true,
        },
      });

      await this.notificationsService
        .notifyReservationCreated({
          reservationId:
            createdReservation.id,

          referenceNo:
            createdReservation
              .referenceNo,

          guestName:
            `${createdReservation.guest.firstName} ${createdReservation.guest.lastName}`,

          roomNumber:
            createdReservation
              .room
              .roomNumber,
        });

      return createdReservation;
  }

  async updateStatus(
    id: string,
    newStatus: ReservationStatus,
  ) {
    const reservation =
      await this.findOne(id);

    const allowedTransitions: Record<
      ReservationStatus,
      ReservationStatus[]
    > = {
      PENDING: [
        ReservationStatus.CANCELLED,
      ],

      CONFIRMED: [
        ReservationStatus.CANCELLED,
      ],

      CHECKED_IN: [],

      CHECKED_OUT: [],

      CANCELLED: [],
    };

    const allowed =
      allowedTransitions[
        reservation.status
      ];

    if (
      !allowed.includes(newStatus)
    ) {
      throw new BadRequestException(
        `Cannot change reservation from ${reservation.status} to ${newStatus}.`,
      );
    }

    if (
      newStatus ===
      ReservationStatus.CANCELLED
    ) {
      await this.paymentsService
        .cancelPendingPaymentsForReservation(
          id,
        );
    }

    const updatedReservation =
    await this.prisma
      .reservation
      .update({
        where: {
          id,
        },

        data: {
          status:
            newStatus,

          ...(newStatus ===
          ReservationStatus.CANCELLED
            ? {
                cancelledAt:
                  new Date(),
              }
            : {}),
        },

        include: {
          guest: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },

          room: true,
        },
      });
      if (
          newStatus ===
          ReservationStatus.CANCELLED
        ) {
          await this.notificationsService
            .notifyReservationCancelled({
              reservationId:
                updatedReservation.id,

              referenceNo:
                updatedReservation
                  .referenceNo,

              guestName:
                `${updatedReservation.guest.firstName} ${updatedReservation.guest.lastName}`,
            });
        }

        return updatedReservation;
  }

  async cancel(
  id: string,
  user: AuthenticatedUser,
) {
  const reservation =
    await this.findOne(id);

  if (
    user.role ===
      UserRole.CUSTOMER &&
    reservation.guestId !==
      user.id
  ) {
    throw new ForbiddenException(
      'You cannot cancel this reservation.',
    );
  }

  const cancellableStatuses:
    ReservationStatus[] = [
      ReservationStatus.PENDING,
      ReservationStatus.CONFIRMED,
    ];

  if (
    !cancellableStatuses.includes(
      reservation.status,
    )
  ) {
    throw new BadRequestException(
      'This reservation can no longer be cancelled.',
    );
  }

  await this.paymentsService
  .cancelPendingPaymentsForReservation(
    id,
  );
  
  const cancelledReservation =
  await this.prisma
    .reservation
    .update({
      where: {
        id,
      },

      data: {
        status:
          ReservationStatus.CANCELLED,

        cancelledAt:
          new Date(),
      },
    });
    await this.notificationsService
  .notifyReservationCancelled({
    reservationId:
      reservation.id,

    referenceNo:
      reservation
        .referenceNo,

    guestName:
      `${reservation.guest.firstName} ${reservation.guest.lastName}`,
  });

return cancelledReservation;
  }
}