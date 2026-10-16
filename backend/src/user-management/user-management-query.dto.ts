import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

import { UserRole, UserStatus } from '../generated/prisma/enums';

// Define the validated user management query input accepted by the API.
export class UserManagementQueryDto {
  // Validate page using the rules declared below.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  page?: number;
  // Validate search using the rules declared below.
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  // Validate role using the rules declared below.
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  // Validate status using the rules declared below.
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
