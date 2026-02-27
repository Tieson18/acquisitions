type UserRole = 'user' | 'admin';

interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

interface TokenPayload {
  id: number;
  email: string;
  role: UserRole;
}

declare namespace Express {
  interface Request {
    user?: TokenPayload;
  }
}
