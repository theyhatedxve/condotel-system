import { Transform, Type } from 'class-transformer';

import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { RoomStatus } from '../generated/prisma/enums';

// Define the validated create room input accepted by the API.
export class CreateRoomDto {
  // Validate and normalize room number using the rules declared below.
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  roomNumber: string;

  // Validate and normalize name using the rules declared below.
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  // Validate and normalize room type using the rules declared below.
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  roomType: string;

  // Validate and normalize description using the rules declared below.
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const result = value.trim();

    return result === '' ? undefined : result;
  })
  description?: string;

  // Validate floor using the rules declared below.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  floor?: number;

  // Validate capacity using the rules declared below.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity: number;

  // Validate rate per night centavos using the rules declared below.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ratePerNightCentavos: number;

  // Validate status using the rules declared below.
  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  // Validate image url using the rules declared below.
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  imageUrl?: string;

  // Validate is active using the rules declared below.
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
