import { Type } from 'class-transformer';

import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class AvailabilityQueryDto {
  @IsDateString()
  checkIn: string;

  @IsDateString()
  checkOut: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;
}
