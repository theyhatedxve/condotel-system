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

export class UpdateManagedUserDto {
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  username?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(UserRole)
  role?: UserRole;

  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(UserStatus)
  status?: UserStatus;
}
