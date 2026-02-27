import type { Request, Response, NextFunction } from 'express';
import logger from '#config/logger.ts';
import { formatValidationError } from '#utils/format.ts';
import { signupSchema, signinSchema } from '#validations/auth.validation.ts';
import { createUser, authenticateUser } from '#services/auth.service.ts';
import { jwttoken } from '#utils/jwt.ts';
import { cookies } from '#utils/cookie.ts';

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationResult = signupSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }
    const { name, email, password, role } = validationResult.data;

    // AUTH SERVICE
    const user = await createUser({ name, email, password, role });

    if (!user) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    const token = jwttoken.sign({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    cookies.set(res, 'token', token);

    logger.info(`User registration successful:${email}`);
    res.status(201).json({
      message: 'User registered',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    logger.error('Signup Error', e);

    if (e instanceof Error && e.message === 'User already exist') {
      return res.status(409).json({ error: 'Email already exist' });
    }

    next(e);
  }
};

export const signin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationResult = signinSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { email, password } = validationResult.data;

    const user = await authenticateUser({ email, password });

    const token = jwttoken.sign({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    cookies.set(res, 'token', token);

    logger.info(`User sign-in successful:${email}`);
    res.status(200).json({
      message: 'Sign-in successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    logger.error('Signin Error', e);

    if (e instanceof Error && e.message === 'User not found') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (e instanceof Error && e.message === 'Invalid password') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    next(e);
  }
};

export const signout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    cookies.clear(res, 'token');

    logger.info('User sign-out successful');
    res.status(200).json({ message: 'Sign-out successful' });
  } catch (e) {
    logger.error('Signout Error', e);
    next(e);
  }
};
