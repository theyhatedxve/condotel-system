import { IsEnum } from 'class-validator';

import { ReservationStatus } from '../generated/prisma/enums';

// Define the validated update reservation status input accepted by the API.
export class UpdateReservationStatusDto {
  // Validate status using the rules declared below.
  @IsEnum(ReservationStatus)
  status: ReservationStatus;
}
