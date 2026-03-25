import type { Request, Response, NextFunction } from 'express';
import logger from '#config/logger.ts';
import { formatValidationError } from '#utils/format.ts';
import {
  userIdSchema,
  updateUserSchema,
} from '#validations/users.validation.ts';
import {
  getAllUsers,
  getUserById as getUserByIdService,
  updateUser as updateUserService,
  deleteUser as deleteUserService,
} from '#services/users.service.ts';
import type { UpdateUserDto } from '#types/user.types.ts';

export const fetchAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info('Fetching all users...');
    const allUsers = await getAllUsers();
    res.status(200).json({
      message: 'Users fetched successfully',
      users: allUsers,
    });
  } catch (e) {
    logger.error('Error fetching users', e);
    next(e);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;
    logger.info(`Fetching user with ID ${id}...`);

    const user = await getUserByIdService(id);

    res.status(200).json({
      message: 'User fetched successfully',
      user,
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    logger.error('Error fetching user by ID', e);
    next(e);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const paramsResult = userIdSchema.safeParse(req.params);
    if (!paramsResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(paramsResult.error),
      });
    }

    const bodyResult = updateUserSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(bodyResult.error),
      });
    }

    const { id } = paramsResult.data;
    const updates = bodyResult.data;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Non-admins can only update their own profile
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({
        error: 'Forbidden: You can only update your own profile',
      });
    }

    // Only admins may change the role field
    if (updates.role !== undefined && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden: Only admins can change user roles',
      });
    }

    logger.info(`Updating user with ID ${id}...`);
    const updatedUser = await updateUserService(id, updates as UpdateUserDto);

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    logger.error('Error updating user', e);
    next(e);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Non-admins can only delete their own account
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({
        error: 'Forbidden: You can only delete your own account',
      });
    }

    logger.info(`Deleting user with ID ${id}...`);
    await deleteUserService(id);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (e) {
    if (e instanceof Error && e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    logger.error('Error deleting user', e);
    next(e);
  }
};
