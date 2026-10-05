import {
  Injectable,
} from '@nestjs/common';

import {
  PrismaService,
} from '../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async findAll() {
    return this.prisma
      .transaction
      .findMany({
        include: {
          payment: {
            include: {
              reservation: {
                include: {
                  guest: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },

                  room: {
                    select: {
                      id: true,
                      roomNumber: true,
                      name: true,
                      roomType: true,
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
      });
  }
}