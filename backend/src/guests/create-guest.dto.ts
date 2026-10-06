import { Transform } from 'class-transformer';

import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateGuestDto {
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim().toLowerCase()
      : value,
  )
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9._-]+$/, {
    message:
      'Username may only contain letters, numbers, dots, underscores, and hyphens.',
  })
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const username =
      value.trim().toLowerCase();

    return username === ''
      ? undefined
      : username;
  })
  username?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim()
      : value,
  )
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim()
      : value,
  )
  lastName: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  province?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  emergencyContactPhone?: string;
}