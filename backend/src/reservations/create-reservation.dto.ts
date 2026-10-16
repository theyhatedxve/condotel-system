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

// Define the validated create reservation input accepted by the API.
export class CreateReservationDto {
  // Validate guest id using the rules declared below.
  @IsOptional()
  @IsString()
  guestId?: string;

  // Validate room id using the rules declared below.
  @IsString()
  roomId: string;

  // Validate check in using the rules declared below.
  @IsDateString()
  checkIn: string;

  // Validate check out using the rules declared below.
  @IsDateString()
  checkOut: string;

  // Validate adults using the rules declared below.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  adults: number;

  // Validate children using the rules declared below.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  children?: number;

  // Validate special requests using the rules declared below.
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  specialRequests?: string;

  // Validate estimated arrival using the rules declared below.
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  estimatedArrival?: string;
}
