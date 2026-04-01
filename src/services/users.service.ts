import { db } from '#config/database.ts';
import logger from '#config/logger.ts';
import { users } from '#models/user.model.ts';
import type { UpdateUserDto } from '#types';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

export const getAllUsers = async () => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users);
    logger.info(`Fetched all users successfully, count: ${allUsers.length}`);
    return allUsers;
  } catch (e) {
    logger.error('Error fetching users', e);
    throw new Error('Error fetching users', { cause: e });
  }
};

export const getUserById = async (id: number) => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!user) {
      logger.warn(`User with ID ${id} not found`);
      throw new Error('User not found');
    }
    logger.info(`Fetched user with ID ${id} successfully`);
    return user;
  } catch (e) {
    logger.error('Error fetching user', e);
    throw e;
  }
};

export const updateUser = async (id: number, updates: UpdateUserDto) => {
  try {
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existingUser) throw new Error('User not found');

    const passwordHash = updates.password
      ? await bcrypt.hash(updates.password, 10)
      : undefined;

    const [updatedUser] = await db
      .update(users)
      .set({
        ...(updates.name !== undefined ? { name: updates.name } : {}),
        ...(updates.email !== undefined ? { email: updates.email } : {}),
        ...(updates.role !== undefined ? { role: updates.role } : {}),
        ...(passwordHash !== undefined ? { password: passwordHash } : {}),
        updated_at: new Date(),
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      });

    logger.info(`User ${id} updated successfully`);
    return updatedUser;
  } catch (e) {
    logger.error('Error updating user', e);
    throw e;
  }
};

export const deleteUser = async (id: number) => {
  try {
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existingUser) throw new Error('User not found');

    await db.delete(users).where(eq(users.id, id));

    logger.info(`User ${id} deleted successfully`);
  } catch (e) {
    logger.error('Error deleting user', e);
    throw e;
  }
};
