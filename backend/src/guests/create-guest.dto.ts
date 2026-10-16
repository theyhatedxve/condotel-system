import { Transform } from 'class-transformer';

import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

// Define the validated create guest input accepted by the API.
export class CreateGuestDto {
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

  // Validate phone using the rules declared below.
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  // Validate address using the rules declared below.
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  // Validate city using the rules declared below.
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  // Validate province using the rules declared below.
  @IsOptional()
  @IsString()
  @MaxLength(100)
  province?: string;

  // Validate postal code using the rules declared below.
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  // Validate emergency contact name using the rules declared below.
  @IsOptional()
  @IsString()
  @MaxLength(100)
  emergencyContactName?: string;

  // Validate emergency contact phone using the rules declared below.
  @IsOptional()
  @IsString()
  @MaxLength(30)
  emergencyContactPhone?: string;
}
