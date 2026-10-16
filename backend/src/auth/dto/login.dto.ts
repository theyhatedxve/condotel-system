import { Transform } from 'class-transformer';

import { IsString, MaxLength, MinLength } from 'class-validator';

// Define the validated login input accepted by the API.
export class LoginDto {
  // Validate and normalize identifier using the rules declared below.
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  identifier: string;

  // Validate password using the rules declared below.
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string;
}
