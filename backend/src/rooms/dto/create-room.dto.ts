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

import {
  RoomStatus,
} from '../../generated/prisma/enums';

export class CreateRoomDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim()
      : value,
  )
  roomNumber: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim()
      : value,
  )
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim()
      : value,
  )
  roomType: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const result = value.trim();

    return result === ''
      ? undefined
      : result;
  })
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  floor?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  ratePerNightCentavos: number;

  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}