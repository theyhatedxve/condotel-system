import {
  IsEnum,
} from 'class-validator';

import {
  RoomStatus,
} from '../../generated/prisma/enums';

export class UpdateRoomStatusDto {
  @IsEnum(RoomStatus)
  status: RoomStatus;
}