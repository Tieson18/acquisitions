import type { UserRole } from './user.types.ts';

/** Request body for the sign-in endpoint. */
export interface LoginPayload {
  email: string;
  password: string;
}

/** Request body for the sign-up endpoint. */
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

/** Payload encoded inside a JWT and attached to req.user after verification. */
export interface JwtPayload {
  id: number;
  email: string;
  role: UserRole;
}
