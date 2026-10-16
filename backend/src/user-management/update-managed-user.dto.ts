import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

import { UserRole, UserStatus } from '../generated/prisma/enums';

// Define the validated update managed user input accepted by the API.
export class UpdateManagedUserDto {
  // Validate first name using the rules declared below.
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName?: string;

  // Validate last name using the rules declared below.
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName?: string;

  // Validate email using the rules declared below.
  @ValidateIf((_, value) => value !== undefined)
  @IsEmail()
  @MaxLength(255)
  email?: string;

  // Validate username using the rules declared below.
  @IsOptional()
  @IsString()
  @MaxLength(80)
  username?: string | null;

  // Validate phone using the rules declared below.
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  // Validate role using the rules declared below.
  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(UserRole)
  role?: UserRole;

  // Validate status using the rules declared below.
  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(UserStatus)
  status?: UserStatus;
}
