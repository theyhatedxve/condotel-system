import { Type } from 'class-transformer';

import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

// Define the validated availability query input accepted by the API.
export class AvailabilityQueryDto {
  // Validate check in using the rules declared below.
  @IsDateString()
  checkIn: string;

  // Validate check out using the rules declared below.
  @IsDateString()
  checkOut: string;

  // Validate capacity using the rules declared below.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;
}
