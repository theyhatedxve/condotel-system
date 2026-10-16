import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

import { ReservationStatus } from '../generated/prisma/enums';

// Define the validated reservation query input accepted by the API.
export class ReservationQueryDto {
  // Validate page using the rules declared below.
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(10000) page?: number;
  // Validate status using the rules declared below.
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  // Validate guest id using the rules declared below.
  @IsOptional()
  @IsString()
  guestId?: string;

  // Validate room id using the rules declared below.
  @IsOptional()
  @IsString()
  roomId?: string;
}
