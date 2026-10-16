import {
  IsEmail,
  ValidateIf,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

// Define the validated update guest input accepted by the API.
export class UpdateGuestDto {
  // Validate email using the rules declared below.
  @ValidateIf((_, value) => value !== undefined)
  @IsEmail()
  @MaxLength(255)
  email?: string;
  // Validate first name using the rules declared below.
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  // Validate last name using the rules declared below.
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

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
