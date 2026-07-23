import { Router } from 'express';
import { getProfile } from '../controllers/user.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route GET /api/users/profile
 * @desc  Get user profile details
 */
router.get('/profile', authenticateToken, getProfile);

export default router;
