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
export class CreateManagedUserDto extends RegisterDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
export class ImportManagedUsersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateManagedUserDto)
  users: CreateManagedUserDto[];
}
