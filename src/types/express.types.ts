import type { JwtPayload } from './auth.types.ts';

declare global {
  namespace Express {
    interface Request {
      /** Populated by JWT auth middleware after token verification. */
      user?: JwtPayload;
    }
  }
}

// export {} makes this a module so declare global is valid
export {};
