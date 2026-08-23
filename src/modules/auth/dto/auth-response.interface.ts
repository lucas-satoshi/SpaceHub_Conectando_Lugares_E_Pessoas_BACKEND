import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
}

export interface AuthResponse {
  message: string;
  user: AuthUser;
  accessToken: string;
}
