import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
export class UpdateReservationNotesDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  specialRequests?: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  estimatedArrival?: string;
}
