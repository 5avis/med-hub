import asyncHandler from 'express-async-handler';
import prisma from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * @desc    Get profile for currently authenticated user
 * @route   GET /api/users/profile
 * @access  Protected (Full Access & Read Only)
 */
export const getProfile = asyncHandler(async (req, res) => {
  const { userId, role, medhubId } = req.user;

  if (role === 'read_only') {
    // Read-only user authenticated via Med.hub ID
    const user = await prisma.user.findUnique({
      where: { medhubId: medhubId || userId },
    });

    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return sendSuccess(res, 'Read-only user profile retrieved', {
        ...userWithoutPassword,
        role: 'readonly',
      });
    }

    return sendSuccess(res, 'Read-only profile retrieved', {
      id: userId || medhubId,
      name: `Viewer (${medhubId || userId})`,
      email: `${(medhubId || 'viewer').toLowerCase()}@medhub.id`,
      role: 'readonly',
      medhubId: medhubId || userId,
      age: 'N/A',
      bloodGroup: 'N/A',
      height: 'N/A',
      weight: 'N/A',
      contact: 'N/A',
      medicalHistory: 'Read-only Med.hub ID viewer access. Limited clinical data available.',
    });
  }

  // Full access user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return sendError(res, 'User record not found', 404);
  }

  const { password: _, ...userWithoutPassword } = user;
  return sendSuccess(res, 'User profile retrieved successfully', {
    ...userWithoutPassword,
    role: 'full',
    blood_group: user.bloodGroup, // compatibility alias
  });
});
