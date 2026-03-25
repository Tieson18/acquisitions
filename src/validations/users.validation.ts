import z from 'zod';

export const userIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(2).max(255).trim().optional(),
    email: z.email().max(255).toLowerCase().trim().optional(),
    password: z.string().min(6).max(128).optional(),
    role: z.enum(['user', 'admin']).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field must be provided for update',
  });
