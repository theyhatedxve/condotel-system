import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  NotificationType,
  ReservationStatus,
  UserRole,
  UserStatus,
} from '../generated/prisma/enums';

import {
  PrismaService,
} from '../prisma/prisma.service';

interface CreateStaffNotificationInput {
  type: NotificationType;

  title: string;
  message: string;

  entityType?: string;
  entityId?: string;

  path?: string;

  dedupeKeyPrefix?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger =
    new Logger(
      NotificationsService.name,
    );

  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  private async createForStaffAndAdmins(
    input:
      CreateStaffNotificationInput,
  ) {
    const recipients =
      await this.prisma
        .user
        .findMany({
          where: {
            role: {
              in: [
                UserRole.STAFF,
                UserRole.ADMIN,
              ],
            },

            status:
              UserStatus.ACTIVE,
          },

          select: {
            id: true,
          },
        });

    for (
      const recipient
      of recipients
    ) {
      const dedupeKey =
        input.dedupeKeyPrefix
          ? `${input.dedupeKeyPrefix}:${recipient.id}`
          : null;

      if (dedupeKey) {
        await this.prisma
          .notification
          .upsert({
            where: {
              dedupeKey,
            },

            update: {},

            create: {
              userId:
                recipient.id,

              type:
                input.type,

              title:
                input.title,

              message:
                input.message,

              entityType:
                input.entityType ??
                null,

              entityId:
                input.entityId ??
                null,

              path:
                input.path ??
                null,

              dedupeKey,
            },
          });

        continue;
      }

      await this.prisma
        .notification
        .create({
          data: {
            userId:
              recipient.id,

            type:
              input.type,

            title:
              input.title,

            message:
              input.message,

            entityType:
              input.entityType ??
              null,

            entityId:
              input.entityId ??
              null,

            path:
              input.path ??
              null,
          },
        });
    }
  }

  private async safelyCreate(
    input:
      CreateStaffNotificationInput,
  ) {
    try {
      await this
        .createForStaffAndAdmins(
          input,
        );
    } catch (error) {
      this.logger.error(
        'Unable to create notification.',
        error instanceof Error
          ? error.stack
          : undefined,
      );
    }
  }

  async notifyReservationCreated(
    input: {
      reservationId: string;
      referenceNo: string;
      guestName: string;
      roomNumber: string;
    },
  ) {
    await this.safelyCreate({
      type:
        NotificationType
          .RESERVATION_CREATED,

      title:
        'New reservation',

      message:
        `${input.guestName} created reservation ${input.referenceNo} for Room ${input.roomNumber}.`,

      entityType:
        'Reservation',

      entityId:
        input.reservationId,

      path:
        '/admin/reservations',

      dedupeKeyPrefix:
        `RESERVATION_CREATED:${input.reservationId}`,
    });
  }

  async notifyReservationCancelled(
    input: {
      reservationId: string;
      referenceNo: string;
      guestName: string;
    },
  ) {
    await this.safelyCreate({
      type:
        NotificationType
          .RESERVATION_CANCELLED,

      title:
        'Reservation cancelled',

      message:
        `${input.referenceNo} for ${input.guestName} was cancelled.`,

      entityType:
        'Reservation',

      entityId:
        input.reservationId,

      path:
        '/admin/reservations',

      dedupeKeyPrefix:
        `RESERVATION_CANCELLED:${input.reservationId}`,
    });
  }

  async notifyPaymentReceived(
    input: {
      paymentId: string;
      reservationId: string;
      referenceNo: string;
      amountCentavos: number;
    },
  ) {
    const amount =
      new Intl.NumberFormat(
        'en-PH',
        {
          style: 'currency',
          currency: 'PHP',
        },
      ).format(
        input.amountCentavos /
          100,
      );

    await this.safelyCreate({
      type:
        NotificationType
          .PAYMENT_RECEIVED,

      title:
        'Payment received',

      message:
        `${amount} was received for reservation ${input.referenceNo}.`,

      entityType:
        'Payment',

      entityId:
        input.paymentId,

      path:
        '/admin/payments',

      dedupeKeyPrefix:
        `PAYMENT_RECEIVED:${input.paymentId}`,
    });
  }

  private async createUpcomingCheckInNotifications() {
    try {
      const now =
        new Date();

      const upcomingUntil =
        new Date(
          now.getTime() +
            24 *
              60 *
              60 *
              1000,
        );

      const reservations =
        await this.prisma
          .reservation
          .findMany({
            where: {
              status:
                ReservationStatus
                  .CONFIRMED,

              checkIn: {
                gte: now,
                lte:
                  upcomingUntil,
              },
            },

            include: {
              guest: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },

              room: {
                select: {
                  roomNumber: true,
                },
              },
            },
          });

      for (
        const reservation
        of reservations
      ) {
        const guestName =
          `${reservation.guest.firstName} ${reservation.guest.lastName}`;

        await this
          .createForStaffAndAdmins({
            type:
              NotificationType
                .UPCOMING_CHECK_IN,

            title:
              'Upcoming check-in',

            message:
              `${guestName} is scheduled to check in to Room ${reservation.room.roomNumber} within the next 24 hours.`,

            entityType:
              'Reservation',

            entityId:
              reservation.id,

            path:
              '/admin/reservations',

            dedupeKeyPrefix:
              `UPCOMING_CHECK_IN:${reservation.id}`,
          });
      }
    } catch (error) {
      this.logger.error(
        'Unable to create upcoming check-in notifications.',
        error instanceof Error
          ? error.stack
          : undefined,
      );
    }
  }

  async findForUser(
    userId: string,
    take = 10,
  ) {
    await this
      .createUpcomingCheckInNotifications();

    const safeTake =
      Math.min(
        Math.max(
          take,
          1,
        ),
        20,
      );

    return this.prisma
      .notification
      .findMany({
        where: {
          userId,
        },

        orderBy: {
          createdAt: 'desc',
        },

        take:
          safeTake,
      });
  }

  async getUnreadCount(
    userId: string,
  ) {
    await this
      .createUpcomingCheckInNotifications();

    const count =
      await this.prisma
        .notification
        .count({
          where: {
            userId,

            isRead:
              false,
          },
        });

    return {
      count,
    };
  }

  async markAsRead(
    notificationId: string,
    userId: string,
  ) {
    const notification =
      await this.prisma
        .notification
        .findFirst({
          where: {
            id:
              notificationId,

            userId,
          },
        });

    if (!notification) {
      throw new NotFoundException(
        'Notification not found.',
      );
    }

    if (
      notification.isRead
    ) {
      return notification;
    }

    return this.prisma
      .notification
      .update({
        where: {
          id:
            notification.id,
        },

        data: {
          isRead:
            true,

          readAt:
            new Date(),
        },
      });
  }

  async markAllAsRead(
    userId: string,
  ) {
    const result =
      await this.prisma
        .notification
        .updateMany({
          where: {
            userId,

            isRead:
              false,
          },

          data: {
            isRead:
              true,

            readAt:
              new Date(),
          },
        });

    return {
      updated:
        result.count,
    };
  }
}