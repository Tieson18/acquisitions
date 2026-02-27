import aj from '#config/arcjet.ts';
import logger from '#config/logger.ts';
import { slidingWindow } from '@arcjet/node';
import type { NextFunction, Request, Response } from 'express';

type RateLimitRole = UserRole | 'guest';

const ROLE_LIMITS: Record<RateLimitRole, number> = {
  admin: Number(process.env.ADMIN_LIMIT) || 20,
  user: Number(process.env.USER_LIMIT) || 10,
  guest: Number(process.env.GUEST_LIMIT) || 5,
};

const arcjetClients: Record<RateLimitRole, ReturnType<typeof aj.withRule>> = {
  admin: aj.withRule(
    slidingWindow({
      mode: 'LIVE',
      interval: '1m',
      max: ROLE_LIMITS.admin,
    })
  ),
  user: aj.withRule(
    slidingWindow({
      mode: 'LIVE',
      interval: '1m',
      max: ROLE_LIMITS.user,
    })
  ),
  guest: aj.withRule(
    slidingWindow({
      mode: 'LIVE',
      interval: '1m',
      max: ROLE_LIMITS.guest,
    })
  ),
};

const blockRequest = (
  res: Response,
  reason: string,
  message: string,
  context: Record<string, unknown>
): void => {
  logger.warn(`${reason} request blocked`, context);
  res.status(reason === 'RateLimit' ? 429 : 403).json({
    error: `Forbidden: ${reason} request blocked`,
    message,
  });
};

const securityMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const role: RateLimitRole = req.user?.role ?? 'guest';
    const client = arcjetClients[role];
    const decision = await client.protect(req);

    if (decision.isDenied()) {
      const context = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      };

      if (decision.reason.isBot()) {
        return blockRequest(
          res,
          'Bot',
          'Your request was identified as coming from a bot and has been blocked.',
          context
        );
      }

      if (decision.reason.isShield()) {
        return blockRequest(
          res,
          'Shield',
          'Your request was blocked by our security shield.',
          context
        );
      }

      if (decision.reason.isRateLimit()) {
        return blockRequest(
          res,
          'RateLimit',
          'You have exceeded the allowed number of requests. Please try again later.',
          context
        );
      }
    }

    next();
  } catch (e) {
    logger.error('Security middleware error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default securityMiddleware;
