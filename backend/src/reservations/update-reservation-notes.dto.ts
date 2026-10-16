import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
// Define the validated update reservation notes input accepted by the API.
export class UpdateReservationNotesDto {
  // Validate special requests using the rules declared below.
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  specialRequests?: string | null;

  // Validate estimated arrival using the rules declared below.
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  estimatedArrival?: string;
}
