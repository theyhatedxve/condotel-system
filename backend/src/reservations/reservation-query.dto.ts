import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

import {
  ReservationStatus,
} from '../generated/prisma/enums';

export class ReservationQueryDto {
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsOptional()
  @IsString()
  guestId?: string;

  @IsOptional()
  @IsString()
  roomId?: string;
}