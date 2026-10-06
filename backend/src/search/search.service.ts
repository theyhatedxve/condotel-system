import {
  Injectable,
} from '@nestjs/common';

import {
  PaymentMethod,
  PaymentStatus,
  TransactionStatus,
  TransactionType,
  UserRole,
} from '../generated/prisma/enums';

import {
  PrismaService,
} from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async search(
    query: string,
  ) {
    const normalizedQuery =
      query.trim();

    const lowerQuery =
      normalizedQuery
        .toLowerCase();

    // Convert partial status/method text into enum values before building Prisma filters.
    const matchingPaymentStatuses =
      Object.values(
        PaymentStatus,
      ).filter(
        (status) =>
          status
            .toLowerCase()
            .includes(
              lowerQuery,
            ),
      );

    const matchingPaymentMethods =
      Object.values(
        PaymentMethod,
      ).filter(
        (method) =>
          method
            .toLowerCase()
            .includes(
              lowerQuery,
            ),
      );

    const matchingTransactionTypes =
      Object.values(
        TransactionType,
      ).filter(
        (type) =>
          type
            .toLowerCase()
            .includes(
              lowerQuery,
            ),
      );

    const matchingTransactionStatuses =
      Object.values(
        TransactionStatus,
      ).filter(
        (status) =>
          status
            .toLowerCase()
            .includes(
              lowerQuery,
            ),
      );

    const [
      guests,
      rooms,
      reservations,
      payments,
      transactions,
    ] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          role:
            UserRole.CUSTOMER,

          OR: [
            {
              firstName: {
                contains:
                  normalizedQuery,
              },
            },
            {
              lastName: {
                contains:
                  normalizedQuery,
              },
            },
            {
              email: {
                contains:
                  normalizedQuery,
              },
            },
            {
              username: {
                contains:
                  normalizedQuery,
              },
            },
            {
              phone: {
                contains:
                  normalizedQuery,
              },
            },
          ],
        },

        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
        },

        orderBy: [
          {
            lastName: 'asc',
          },
          {
            firstName: 'asc',
          },
        ],

        take: 5,
      }),

      this.prisma.room.findMany({
        where: {
          OR: [
            {
              roomNumber: {
                contains:
                  normalizedQuery,
              },
            },
            {
              name: {
                contains:
                  normalizedQuery,
              },
            },
            {
              roomType: {
                contains:
                  normalizedQuery,
              },
            },
            {
              description: {
                contains:
                  normalizedQuery,
              },
            },
          ],
        },

        select: {
          id: true,
          roomNumber: true,
          name: true,
          roomType: true,
          status: true,
          isActive: true,
        },

        orderBy: {
          roomNumber: 'asc',
        },

        take: 5,
      }),

      this.prisma.reservation
        .findMany({
          where: {
            OR: [
              {
                referenceNo: {
                  contains:
                    normalizedQuery,
                },
              },

              {
                guest: {
                  is: {
                    OR: [
                      {
                        firstName: {
                          contains:
                            normalizedQuery,
                        },
                      },
                      {
                        lastName: {
                          contains:
                            normalizedQuery,
                        },
                      },
                      {
                        email: {
                          contains:
                            normalizedQuery,
                        },
                      },
                    ],
                  },
                },
              },

              {
                room: {
                  is: {
                    OR: [
                      {
                        roomNumber: {
                          contains:
                            normalizedQuery,
                        },
                      },
                      {
                        name: {
                          contains:
                            normalizedQuery,
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },

          select: {
            id: true,
            referenceNo: true,
            status: true,
            checkIn: true,
            checkOut: true,
            totalAmountCentavos:
              true,

            guest: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },

            room: {
              select: {
                roomNumber: true,
                name: true,
              },
            },
          },

          orderBy: {
            createdAt: 'desc',
          },

          take: 5,
        }),

      this.prisma.payment
        .findMany({
          where: {
            OR: [
              {
                provider: {
                  contains:
                    normalizedQuery,
                },
              },

              {
                paymongoCheckoutSessionId:
                  {
                    contains:
                      normalizedQuery,
                  },
              },

              {
                paymongoPaymentIntentId:
                  {
                    contains:
                      normalizedQuery,
                  },
              },

              {
                paymongoPaymentId:
                  {
                    contains:
                      normalizedQuery,
                  },
              },

              ...matchingPaymentStatuses
                .map(
                  (status) => ({
                    status,
                  }),
                ),

              ...matchingPaymentMethods
                .map(
                  (method) => ({
                    method,
                  }),
                ),

              {
                reservation: {
                  is: {
                    OR: [
                      {
                        referenceNo: {
                          contains:
                            normalizedQuery,
                        },
                      },

                      {
                        guest: {
                          is: {
                            OR: [
                              {
                                firstName: {
                                  contains:
                                    normalizedQuery,
                                },
                              },
                              {
                                lastName: {
                                  contains:
                                    normalizedQuery,
                                },
                              },
                              {
                                email: {
                                  contains:
                                    normalizedQuery,
                                },
                              },
                            ],
                          },
                        },
                      },

                      {
                        room: {
                          is: {
                            roomNumber: {
                              contains:
                                normalizedQuery,
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },

          select: {
            id: true,
            amountCentavos: true,
            method: true,
            status: true,
            provider: true,
            paymongoPaymentId:
              true,

            reservation: {
              select: {
                referenceNo: true,

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
            },
          },

          orderBy: {
            createdAt: 'desc',
          },

          take: 5,
        }),

      this.prisma.transaction
        .findMany({
          where: {
            OR: [
              {
                id: {
                  contains:
                    normalizedQuery,
                },
              },

              {
                providerReference: {
                  contains:
                    normalizedQuery,
                },
              },

              {
                description: {
                  contains:
                    normalizedQuery,
                },
              },

              ...matchingTransactionTypes
                .map(
                  (type) => ({
                    type,
                  }),
                ),

              ...matchingTransactionStatuses
                .map(
                  (status) => ({
                    status,
                  }),
                ),

              {
                payment: {
                  is: {
                    OR: [
                      {
                        paymongoPaymentId:
                          {
                            contains:
                              normalizedQuery,
                          },
                      },

                      {
                        reservation: {
                          is: {
                            OR: [
                              {
                                referenceNo: {
                                  contains:
                                    normalizedQuery,
                                },
                              },

                              {
                                guest: {
                                  is: {
                                    OR: [
                                      {
                                        firstName: {
                                          contains:
                                            normalizedQuery,
                                        },
                                      },
                                      {
                                        lastName: {
                                          contains:
                                            normalizedQuery,
                                        },
                                      },
                                    ],
                                  },
                                },
                              },

                              {
                                room: {
                                  is: {
                                    roomNumber: {
                                      contains:
                                        normalizedQuery,
                                    },
                                  },
                                },
                              },
                            ],
                          },
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },

          select: {
            id: true,
            type: true,
            status: true,
            amountCentavos: true,
            providerReference: true,
            description: true,

            payment: {
              select: {
                method: true,
                status: true,

                reservation: {
                  select: {
                    referenceNo: true,

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
                },
              },
            },
          },

          orderBy: {
            occurredAt: 'desc',
          },

          take: 5,
        }),
    ]);

    const results = [
      ...guests.map(
        (guest) => ({
          type: 'GUEST',

          id:
            guest.id,

          title:
            `${guest.firstName} ${guest.lastName}`,

          subtitle:
            guest.email,

          status:
            guest.status,

          path:
            '/admin/guests',
        }),
      ),

      ...rooms.map(
        (room) => ({
          type: 'ROOM',

          id:
            room.id,

          title:
            `Room ${room.roomNumber}`,

          subtitle:
            `${room.name} • ${room.roomType}`,

          status:
            room.isActive
              ? room.status
              : 'INACTIVE',

          path:
            '/admin/rooms',
        }),
      ),

      ...reservations.map(
        (reservation) => ({
          type:
            'RESERVATION',

          id:
            reservation.id,

          title:
            reservation
              .referenceNo,

          subtitle:
            `${reservation.guest.firstName} ${reservation.guest.lastName} • Room ${reservation.room.roomNumber}`,

          status:
            reservation.status,

          path:
            '/admin/reservations',
        }),
      ),

      ...payments.map(
        (payment) => ({
          type:
            'PAYMENT',

          id:
            payment.id,

          title:
            payment
              .reservation
              .referenceNo,

          subtitle:
            `${payment.reservation.guest.firstName} ${payment.reservation.guest.lastName} • ${payment.method ?? payment.provider}`,

          status:
            payment.status,

          amountCentavos:
            payment
              .amountCentavos,

          path:
            '/admin/payments',
        }),
      ),

      ...transactions.map(
        (transaction) => ({
          type:
            'TRANSACTION',

          id:
            transaction.id,

          title:
            transaction
              .providerReference ??
            transaction.id,

          subtitle:
            `${transaction.payment.reservation.referenceNo} • ${transaction.type}`,

          status:
            transaction.status,

          amountCentavos:
            transaction
              .amountCentavos,

          path:
            '/admin/transactions',
        }),
      ),
    ];

    // Each category is capped at five matches; counts describe this result set, not all matches.
    return {
      query:
        normalizedQuery,

      results,

      counts: {
        guests:
          guests.length,

        rooms:
          rooms.length,

        reservations:
          reservations.length,

        payments:
          payments.length,

        transactions:
          transactions.length,
      },
    };
  }
}