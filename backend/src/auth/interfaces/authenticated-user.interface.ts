import { UserRole, UserStatus } from '../../generated/prisma/enums';

// Describe the authenticated user data shared by the surrounding code.
export interface AuthenticatedUser {
  id: string;

  email: string;
  username: string | null;

  firstName: string;
  lastName: string;

  phone: string | null;

  role: UserRole;
  status: UserStatus;

  mustChangePassword: boolean;
}
