import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/user.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route GET /api/users/profile
 * @desc  Get user profile details
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @route PUT /api/users/profile
 * @desc  Update user profile & medical onboarding details
 */
router.put('/profile', authenticateToken, updateProfile);

export default router;
