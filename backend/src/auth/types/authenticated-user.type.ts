import { User } from '../../users/domain/user';

export type AuthenticatedUser = Pick<User, 'id' | 'email' | 'role'> & {
  sessionId?: string;
  hash?: string;
};

export type AuthenticatedRequest = {
  user: AuthenticatedUser;
};
