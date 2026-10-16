import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

import { ReservationStatus } from '../generated/prisma/enums';

export class ReservationQueryDto {
  @IsOptional() @Type(()=>Number) @IsInt() @Min(1) @Max(10000) page?: number;
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
