import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateSettingsDto {
  @IsString()
  @MaxLength(120)
  propertyName: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  propertyAddress?:
    | string
    | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  propertyCity?:
    | string
    | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  propertyProvince?:
    | string
    | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?:
    | string
    | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  contactEmail?:
    | string
    | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?:
    | string
    | null;

  @Matches(
    /^([01]\d|2[0-3]):[0-5]\d$/,
    {
      message:
        'checkInTime must use HH:mm format.',
    },
  )
  checkInTime: string;

  @Matches(
    /^([01]\d|2[0-3]):[0-5]\d$/,
    {
      message:
        'checkOutTime must use HH:mm format.',
    },
  )
  checkOutTime: string;
}