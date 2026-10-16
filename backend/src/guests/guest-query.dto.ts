import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { UserStatus } from '../generated/prisma/enums';
export class GuestQueryDto {
  @IsOptional() @IsString() @MaxLength(255) search?: string;
  @IsOptional() @IsEnum(UserStatus) status?: UserStatus;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(10000) page?: number;
}
