import { IsString, MaxLength, MinLength } from 'class-validator';

// Define the validated reset user password input accepted by the API.
export class ResetUserPasswordDto {
  // Validate new password using the rules declared below.
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword: string;
}
