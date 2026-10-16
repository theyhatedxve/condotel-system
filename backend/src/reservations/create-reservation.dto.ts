import { Type } from 'class-transformer';

import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
  Min,
} from 'class-validator';

export class CreateReservationDto {
  @IsOptional()
  @IsString()
  guestId?: string;

  @IsString()
  roomId: string;

  @IsDateString()
  checkIn: string;

  @IsDateString()
  checkOut: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  adults: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  children?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  specialRequests?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  estimatedArrival?: string;
}
