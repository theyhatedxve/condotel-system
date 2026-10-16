import { IsEnum } from 'class-validator';

import { RoomStatus } from '../generated/prisma/enums';

// Define the validated update room status input accepted by the API.
export class UpdateRoomStatusDto {
  // Validate status using the rules declared below.
  @IsEnum(RoomStatus)
  status: RoomStatus;
}
