import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '#types';
import { jwttoken } from '#utils/jwt.ts';
import logger from '#config/logger.ts';

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No access token provided',
      });
    }

    const decoded = jwttoken.verify(token) as {
      id: number;
      email: string;
      role: 'admin' | 'user';
    };

    req.user = decoded;

    logger.info(`User authenticated: ${decoded.email} (${decoded.role})`);
    next();
  } catch (e) {
    logger.error('Authentication error:', e);

    if (e instanceof Error && e.message === 'Failed to authenticate token') {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid or expired token',
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Error during authentication',
    });
  }
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated',
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(
          `Access denied for user ${req.user.email} with role ${req.user.role}. Required: ${allowedRoles.join(', ')}`
        );

        return res.status(403).json({
          error: 'Access denied',
          message: 'Insufficient permissions',
        });
      }

      next();
    } catch (e) {
      logger.error('Role verification error:', e);

      return res.status(500).json({
        error: 'Internal server error',
        message: 'Error during role verification',
      });
    }
  };
};
