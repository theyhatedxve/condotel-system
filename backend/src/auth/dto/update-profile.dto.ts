import {
  IsEmail,
  ValidateIf,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

// Define the validated update profile input accepted by the API.
export class UpdateProfileDto {
  // Validate email using the rules declared below.
  @ValidateIf((_, value) => value !== undefined)
  @IsEmail()
  @MaxLength(255)
  email?: string;
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
}
