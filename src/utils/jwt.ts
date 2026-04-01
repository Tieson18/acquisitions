import logger from '#config/logger.ts';
import type { JwtPayload } from '#types';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'chang-in-production';
const JWT_EXPIRES_IN = '1d';

export const jwttoken = {
  sign: (payload: JwtPayload): string => {
    try {
      return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    } catch (e) {
      logger.error('Failed to sign token', e);
      throw new Error('Failed to sign token', { cause: e });
    }
  },

  verify: (token: string): jwt.JwtPayload | string => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (e) {
      logger.error('Failed to verify token', e);
      throw new Error('Failed to verify token', { cause: e });
    }
  },
};
