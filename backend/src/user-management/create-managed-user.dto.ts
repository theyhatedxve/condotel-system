import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { RegisterDto } from '../auth/dto/register.dto';
import { UserRole } from '../generated/prisma/enums';
// Define the validated create managed user input accepted by the API.
export class CreateManagedUserDto extends RegisterDto {
  // Validate role using the rules declared below.
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
// Define the validated import managed users input accepted by the API.
export class ImportManagedUsersDto {
  // Validate users using the rules declared below.
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateManagedUserDto)
  users: CreateManagedUserDto[];
}
