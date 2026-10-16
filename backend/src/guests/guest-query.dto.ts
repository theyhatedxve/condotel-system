import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { UserStatus } from '../generated/prisma/enums';
// Define the validated guest query input accepted by the API.
export class GuestQueryDto {
  // Validate search using the rules declared below.
  @IsOptional() @IsString() @MaxLength(255) search?: string;
  // Validate status using the rules declared below.
  @IsOptional() @IsEnum(UserStatus) status?: UserStatus;
  // Validate page using the rules declared below.
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(10000) page?: number;
}
