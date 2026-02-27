import { db } from '#config/database.ts';
import logger from '#config/logger.ts';
import { users } from '#models/user.model.ts';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

export const hashPassword = async (
  password: string | Buffer<ArrayBufferLike>
) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (e) {
    logger.error('Error hashing', e);
    throw new Error('Error hashing');
  }
};

export const comparePassword = async (
  password: string | Buffer<ArrayBufferLike>,
  hash: string
) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (e) {
    logger.error('Error comparing password', e);
    throw new Error('Error comparing password');
  }
};

interface AuthenticateUserInput {
  email: string;
  password: string;
}

export const authenticateUser = async ({ email, password }: AuthenticateUserInput) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) throw new Error('User not found');

    const isValid = await comparePassword(password, user.password);
    if (!isValid) throw new Error('Invalid password');

    logger.info(`User ${user.email} authenticated successfully`);
    return user;
  } catch (e) {
    logger.error('Failed to authenticate user', e);
    throw e;
  }
};

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export const createUser = async ({ name, email, password, role = 'user' }: CreateUserInput) => {
  try {
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUsers.length > 0) throw new Error('User already exist');

    const password_hash = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({ name, email, password: password_hash, role })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
      });
    logger.info(`User ${newUser?.email} created successfully`);
    return newUser;
  } catch (e) {
    logger.error('Failed to create user', e);
    throw e;
  }
};
