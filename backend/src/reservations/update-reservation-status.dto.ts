import {
  IsEnum,
} from 'class-validator';

import {
  ReservationStatus,
} from '../generated/prisma/enums';

export class UpdateReservationStatusDto {
  @IsEnum(ReservationStatus)
  status: ReservationStatus;
}