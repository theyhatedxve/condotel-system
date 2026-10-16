import { PartialType } from '@nestjs/mapped-types';

import { CreateRoomDto } from './create-room.dto';

// Define the validated update room input accepted by the API.
export class UpdateRoomDto extends PartialType(CreateRoomDto) {}
