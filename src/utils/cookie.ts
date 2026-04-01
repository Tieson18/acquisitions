import type { Request, Response, CookieOptions } from 'express';

export const cookies = {
  getOption: (): CookieOptions => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  }),

  set: (
    res: Response,
    name: string,
    value: string,
    options: CookieOptions = {}
  ): void => {
    res.cookie(name, value, { ...cookies.getOption(), ...options });
  },

  clear: (res: Response, name: string, options: CookieOptions = {}): void => {
    res.clearCookie(name, { ...cookies.getOption(), ...options });
  },

  get: (req: Request, name: string): string | undefined => {
    return req.cookies[name];
  },
};
