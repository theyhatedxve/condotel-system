import { Transform } from 'class-transformer';

import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

// Define the validated register input accepted by the API.
export class RegisterDto {
  // Validate and normalize email using the rules declared below.
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  // Validate and normalize username using the rules declared below.
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

    const username = value.trim().toLowerCase();

    return username === '' ? undefined : username;
  })
  username?: string;

  // Validate password using the rules declared below.
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  // Validate and normalize first name using the rules declared below.
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  firstName: string;

  // Validate and normalize last name using the rules declared below.
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  lastName: string;

  // Validate and normalize phone using the rules declared below.
  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const phone = value.trim();

    return phone === '' ? undefined : phone;
  })
  phone?: string;
}
