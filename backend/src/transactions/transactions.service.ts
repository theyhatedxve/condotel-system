import {
  PrivateDataService,
  contactSelect,
} from '../security/private-data.service';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

// Implement transactions operations using the injected dependencies and existing
// business rules.
@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privacy: PrivateDataService,
  ) {}

  // List recorded payment transactions with reservation, room, and authorized guest
  // details.
  async findAll() {
    const rows = await this.prisma.transaction.findMany({
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
                    ...contactSelect,
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
    return rows.map((row) => this.privacy.response(row));
  }
}
