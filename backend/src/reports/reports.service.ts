import { BadRequestException, Injectable } from '@nestjs/common';

import {
  PaymentStatus,
  ReservationStatus,
  RoomStatus,
  TransactionStatus,
  TransactionType,
} from '../generated/prisma/enums';

import { PrismaService } from '../prisma/prisma.service';

import { ReportRangeQueryDto } from './report-range-query.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private getManilaDateString(date = new Date()) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',

      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const parts = formatter.formatToParts(date);

    const year = parts.find((part) => part.type === 'year')?.value;

    const month = parts.find((part) => part.type === 'month')?.value;

    const day = parts.find((part) => part.type === 'day')?.value;

    if (!year || !month || !day) {
      throw new Error('Unable to determine Manila date.');
    }

    return `${year}-${month}-${day}`;
  }

  private getNextDate(value: string) {
    const date = new Date(`${value}T00:00:00+08:00`);

    date.setUTCDate(date.getUTCDate() + 1);

    return date;
  }

  // Interpret report dates in Manila time regardless of the server timezone.
  // The exclusive next-day boundary includes all of the requested final day.
  private createRange(from: string, to: string) {
    const start = new Date(`${from}T00:00:00+08:00`);

    const endExclusive = this.getNextDate(to);

    if (Number.isNaN(start.getTime()) || Number.isNaN(endExclusive.getTime())) {
      throw new BadRequestException('Invalid report date range.');
    }

    if (start.getTime() >= endExclusive.getTime()) {
      throw new BadRequestException(
        'Report start date must not be after the end date.',
      );
    }

    return {
      start,
      endExclusive,
    };
  }

  private resolveRange(query: ReportRangeQueryDto) {
    const today = this.getManilaDateString();

    const [year, month] = today.split('-');

    const defaultFrom = `${year}-${month}-01`;

    const from = query.from ?? defaultFrom;

    const to = query.to ?? today;

    const { start, endExclusive } = this.createRange(from, to);

    return {
      from,
      to,
      start,
      endExclusive,
    };
  }

  async getDashboard() {
    const today = this.getManilaDateString();

    const { start, endExclusive } = this.createRange(today, today);

    const [
      totalRooms,
      availableRooms,
      occupiedRooms,
      maintenanceRooms,
      currentGuestStays,
      todayCheckIns,
      todayCheckOuts,
      todayPayments,
      recentReservations,
    ] = await Promise.all([
      // Total active rooms
      this.prisma.room.count({
        where: {
          isActive: true,
        },
      }),

      // Available rooms
      this.prisma.room.count({
        where: {
          isActive: true,

          status: RoomStatus.AVAILABLE,
        },
      }),

      // Occupied rooms
      this.prisma.room.count({
        where: {
          isActive: true,

          status: RoomStatus.OCCUPIED,
        },
      }),

      // Rooms under maintenance
      this.prisma.room.count({
        where: {
          isActive: true,

          status: RoomStatus.MAINTENANCE,
        },
      }),

      // Current checked-in reservations.
      // We need adults and children so that
      // Current Guests represents PEOPLE,
      // not simply reservation count.
      this.prisma.reservation.findMany({
        where: {
          status: ReservationStatus.CHECKED_IN,
        },

        select: {
          adults: true,
          children: true,
        },
      }),

      // Today's scheduled check-ins
      this.prisma.reservation.count({
        where: {
          checkIn: {
            gte: start,
            lt: endExclusive,
          },

          status: {
            in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN],
          },
        },
      }),

      // Today's scheduled/completed check-outs
      this.prisma.reservation.count({
        where: {
          checkOut: {
            gte: start,
            lt: endExclusive,
          },

          status: {
            in: [
              ReservationStatus.CONFIRMED,

              ReservationStatus.CHECKED_IN,

              ReservationStatus.CHECKED_OUT,
            ],
          },
        },
      }),

      // Today's successfully paid payments
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.PAID,

          paidAt: {
            gte: start,
            lt: endExclusive,
          },
        },

        _sum: {
          amountCentavos: true,
        },

        _count: {
          id: true,
        },
      }),

      // Latest five reservations
      this.prisma.reservation.findMany({
        take: 5,

        include: {
          guest: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },

          room: {
            select: {
              id: true,
              roomNumber: true,
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    // --------------------------------------------------------
    // CURRENT GUESTS
    //
    // Example:
    // Reservation A = 2 adults + 1 child = 3
    // Reservation B = 1 adult + 0 children = 1
    //
    // Current Guests = 4
    // --------------------------------------------------------

    const currentGuests = currentGuestStays.reduce(
      (total, reservation) => total + reservation.adults + reservation.children,
      0,
    );

    // --------------------------------------------------------
    // ROOM OCCUPANCY
    //
    // Occupancy is room-based, not guest-based.
    // --------------------------------------------------------

    const occupancyPercent =
      totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    return {
      date: today,

      statistics: {
        totalRooms,

        currentGuests,

        todayCheckIns,

        todayCheckOuts,

        todayPaymentCount: todayPayments._count.id,

        todayPaymentsCentavos: todayPayments._sum.amountCentavos ?? 0,
      },

      occupancy: {
        totalRooms,

        availableRooms,

        occupiedRooms,

        maintenanceRooms,

        occupancyPercent,
      },

      recentReservations,
    };
  }

  // Reservation/payment counts use creation dates; revenue uses transaction occurrence dates.
  // Room occupancy remains a current snapshot, even for a historical report range.
  async getSummary(query: ReportRangeQueryDto) {
    const { from, to, start, endExclusive } = this.resolveRange(query);

    const [
      totalReservations,
      pendingReservations,
      confirmedReservations,
      checkedInReservations,
      checkedOutReservations,
      cancelledReservations,

      totalPayments,
      paidPayments,
      pendingPayments,
      failedPayments,
      cancelledPayments,
      expiredPayments,
      refundedPayments,

      transactions,

      totalRooms,
      availableRooms,
      occupiedRooms,
      maintenanceRooms,
    ] = await Promise.all([
      // ------------------------------------------------------
      // RESERVATIONS
      // ------------------------------------------------------

      this.prisma.reservation.count({
        where: {
          createdAt: {
            gte: start,
            lt: endExclusive,
          },
        },
      }),

      this.prisma.reservation.count({
        where: {
          status: ReservationStatus.PENDING,

          createdAt: {
            gte: start,
            lt: endExclusive,
          },
        },
      }),

      this.prisma.reservation.count({
        where: {
          status: ReservationStatus.CONFIRMED,

          createdAt: {
            gte: start,
            lt: endExclusive,
          },
        },
      }),

      this.prisma.reservation.count({
        where: {
          status: ReservationStatus.CHECKED_IN,

          createdAt: {
            gte: start,
            lt: endExclusive,
          },
        },
      }),

      this.prisma.reservation.count({
        where: {
          status: ReservationStatus.CHECKED_OUT,

          createdAt: {
            gte: start,
            lt: endExclusive,
          },
        },
      }),

      this.prisma.reservation.count({
        where: {
          status: ReservationStatus.CANCELLED,

          createdAt: {
            gte: start,
            lt: endExclusive,
          },
        },
      }),

      // ------------------------------------------------------
      // PAYMENTS
      // ------------------------------------------------------

      this.prisma.payment.count({
        where: {
          createdAt: {
            gte: start,
            lt: endExclusive,
          },
        },
      }),

      this.prisma.payment.count({
        where: {
          status: PaymentStatus.PAID,

          createdAt: {
            gte: start,
            lt: endExclusive,
          },
        },
      }),

      this.prisma.payment.count({
        where: {
          status: PaymentStatus.PENDING,

          createdAt: {
            gte: start,
            lt: endExclusive,
          },
        },
      }),

      this.prisma.payment.count({
        where: {
          status: PaymentStatus.FAILED,

          createdAt: {
            gte: start,
            lt: endExclusive,
          },
        },
      }),

      this.prisma.payment.count({
        where: {
          status: PaymentStatus.CANCELLED,

          createdAt: {
            gte: start,
            lt: endExclusive,
          },
        },
      }),

      this.prisma.payment.count({
        where: {
          status: PaymentStatus.EXPIRED,

          createdAt: {
            gte: start,
            lt: endExclusive,
          },
        },
      }),

      this.prisma.payment.count({
        where: {
          status: PaymentStatus.REFUNDED,

          createdAt: {
            gte: start,
            lt: endExclusive,
          },
        },
      }),

      // ------------------------------------------------------
      // SUCCESSFUL FINANCIAL TRANSACTIONS
      // ------------------------------------------------------

      this.prisma.transaction.findMany({
        where: {
          occurredAt: {
            gte: start,
            lt: endExclusive,
          },

          status: TransactionStatus.SUCCEEDED,
        },

        select: {
          type: true,

          amountCentavos: true,
        },
      }),

      // ------------------------------------------------------
      // ROOM INVENTORY
      // ------------------------------------------------------

      this.prisma.room.count({
        where: {
          isActive: true,
        },
      }),

      this.prisma.room.count({
        where: {
          isActive: true,

          status: RoomStatus.AVAILABLE,
        },
      }),

      this.prisma.room.count({
        where: {
          isActive: true,

          status: RoomStatus.OCCUPIED,
        },
      }),

      this.prisma.room.count({
        where: {
          isActive: true,

          status: RoomStatus.MAINTENANCE,
        },
      }),
    ]);

    // --------------------------------------------------------
    // FINANCIAL CALCULATIONS
    // --------------------------------------------------------

    let grossRevenueCentavos = 0;

    let refundedCentavos = 0;

    let adjustmentCentavos = 0;

    for (const transaction of transactions) {
      if (transaction.type === TransactionType.PAYMENT) {
        grossRevenueCentavos += transaction.amountCentavos;
      }

      if (transaction.type === TransactionType.REFUND) {
        refundedCentavos += transaction.amountCentavos;
      }

      if (transaction.type === TransactionType.ADJUSTMENT) {
        adjustmentCentavos += transaction.amountCentavos;
      }
    }

    const netRevenueCentavos =
      grossRevenueCentavos - refundedCentavos + adjustmentCentavos;

    // --------------------------------------------------------
    // ROOM OCCUPANCY
    // --------------------------------------------------------

    const occupancyPercent =
      totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    return {
      range: {
        from,
        to,
      },

      revenue: {
        grossRevenueCentavos,

        refundedCentavos,

        adjustmentCentavos,

        netRevenueCentavos,
      },

      reservations: {
        total: totalReservations,

        pending: pendingReservations,

        confirmed: confirmedReservations,

        checkedIn: checkedInReservations,

        checkedOut: checkedOutReservations,

        cancelled: cancelledReservations,
      },

      payments: {
        total: totalPayments,

        paid: paidPayments,

        pending: pendingPayments,

        failed: failedPayments,

        cancelled: cancelledPayments,

        expired: expiredPayments,

        refunded: refundedPayments,
      },

      transactions: {
        succeeded: transactions.length,
      },

      rooms: {
        total: totalRooms,

        available: availableRooms,

        occupied: occupiedRooms,

        maintenance: maintenanceRooms,

        occupancyPercent,
      },
    };
  }
}
