export type UserRole = 'user' | 'admin' | 'guest';

/** Full user entity as stored in the database (includes hashed password). */
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

/** Safe user shape returned in API responses — password is never exposed. */
export interface UserPublic {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

/** Input for creating a new user. */
export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

/** Input for partially updating an existing user. */
export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
}
