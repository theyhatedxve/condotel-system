import { SetMetadata } from '@nestjs/common';

import { UserRole } from '../../generated/prisma/enums';

export const ROLES_KEY = 'roles';

// Attach allowed roles to the handler so RolesGuard can enforce them.
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
