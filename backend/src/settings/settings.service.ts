import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import type {
  AuthenticatedUser,
} from '../auth/interfaces/authenticated-user.interface';

import {
  PrismaService,
} from '../prisma/prisma.service';

import {
  UpdateSettingsDto,
} from './dto/update-settings.dto';

const SYSTEM_SETTINGS_ID =
  'system';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async getSettings() {
    return this.prisma
      .systemSetting
      .upsert({
        where: {
          id:
            SYSTEM_SETTINGS_ID,
        },

        update: {},

        create: {
          id:
            SYSTEM_SETTINGS_ID,
        },
      });
  }

  async updateSettings(
    dto: UpdateSettingsDto,
    user: AuthenticatedUser,
  ) {
    const propertyName =
      dto.propertyName
        .trim();

    if (!propertyName) {
      throw new BadRequestException(
        'Property name is required.',
      );
    }

    const data = {
      propertyName,

      propertyAddress:
        dto.propertyAddress
          ?.trim() ||
        null,

      propertyCity:
        dto.propertyCity
          ?.trim() ||
        null,

      propertyProvince:
        dto.propertyProvince
          ?.trim() ||
        null,

      postalCode:
        dto.postalCode
          ?.trim() ||
        null,

      contactEmail:
        dto.contactEmail
          ?.trim() ||
        null,

      contactPhone:
        dto.contactPhone
          ?.trim() ||
        null,

      checkInTime:
        dto.checkInTime,

      checkOutTime:
        dto.checkOutTime,
    };

    return this.prisma
      .$transaction(
        async (
          transaction,
        ) => {
          const settings =
            await transaction
              .systemSetting
              .upsert({
                where: {
                  id:
                    SYSTEM_SETTINGS_ID,
                },

                update:
                  data,

                create: {
                  id:
                    SYSTEM_SETTINGS_ID,

                  ...data,
                },
              });

          await transaction
            .auditLog
            .create({
              data: {
                actorId:
                  user.id,

                action:
                  'SETTINGS_UPDATED',

                entityType:
                  'SystemSetting',

                entityId:
                  SYSTEM_SETTINGS_ID,

                details:
                  JSON.stringify({
                    updatedFields:
                      Object.keys(
                        data,
                      ),
                  }),
              },
            });

          return settings;
        },
      );
  }
}