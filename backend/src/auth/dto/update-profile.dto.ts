import {
  IsEmail,
  ValidateIf,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ValidateIf((_, value) => value !== undefined)
  @IsEmail()
  @MaxLength(255)
  email?: string;
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

  @IsOptional()
  @IsString()
  @MaxLength(80)
  username?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;
}
