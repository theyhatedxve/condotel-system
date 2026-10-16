import { IsString, MaxLength, MinLength } from 'class-validator';

// Define the validated change password input accepted by the API.
export class ChangePasswordDto {
  // Validate current password using the rules declared below.
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword: string;

  // Validate new password using the rules declared below.
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword: string;
}
