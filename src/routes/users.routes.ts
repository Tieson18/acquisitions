import {
  fetchAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '#controllers/users.controller.ts';
import { authenticateToken, requireRole } from '#middleware/auth.middleware.ts';
import express from 'express';

const router = express.Router();
// GET /users - Admin only
router.get('/', authenticateToken, requireRole(['admin']), fetchAllUsers);
// GET /users/:id - Authenticated users
router.get('/:id', authenticateToken, getUserById);
// PUT /users/:id - user can update their own profile, admin can update any profile
router.put('/:id', authenticateToken, updateUser);
// DELETE /users/:id - Admin only
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteUser);

export default router;
