import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

// Define the validated update settings input accepted by the API.
export class UpdateSettingsDto {
  // Validate property name using the rules declared below.
  @IsString()
  @MaxLength(120)
  propertyName: string;

  // Validate property address using the rules declared below.
  @IsOptional()
  @IsString()
  @MaxLength(250)
  propertyAddress?: string | null;

  // Validate property city using the rules declared below.
  @IsOptional()
  @IsString()
  @MaxLength(100)
  propertyCity?: string | null;

  // Validate property province using the rules declared below.
  @IsOptional()
  @IsString()
  @MaxLength(100)
  propertyProvince?: string | null;

  // Validate postal code using the rules declared below.
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string | null;

  // Validate contact email using the rules declared below.
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  contactEmail?: string | null;

  // Validate contact phone using the rules declared below.
  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string | null;

  // Validate check in time using the rules declared below.
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'checkInTime must use HH:mm format.',
  })
  checkInTime: string;

  // Validate check out time using the rules declared below.
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'checkOutTime must use HH:mm format.',
  })
  checkOutTime: string;
}
