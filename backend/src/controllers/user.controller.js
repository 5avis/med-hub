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

/**
 * @desc    Update profile & complete first-time medical onboarding
 * @route   PUT /api/users/profile
 * @access  Protected
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { userId, role } = req.user;

  if (role === 'read_only' || role === 'readonly') {
    return sendError(res, 'MedHub ID access is read-only. Editing profile details is disabled for MedHub ID logins.', 403);
  }
  const {
    name,
    age,
    gender,
    contact,
    bloodGroup,
    height,
    weight,
    allergies,
    chronicConditions,
    emergencyContact,
    primaryPhysician,
    medicalHistory,
  } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return sendError(res, 'User record not found', 404);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name && { name }),
      ...(age && { age: Number(age) }),
      ...(gender && { gender }),
      ...(contact && { contact }),
      ...(bloodGroup && { bloodGroup }),
      ...(height && { height: String(height) }),
      ...(weight && { weight: String(weight) }),
      ...(allergies !== undefined && { allergies }),
      ...(chronicConditions !== undefined && { chronicConditions }),
      ...(emergencyContact !== undefined && { emergencyContact }),
      ...(primaryPhysician !== undefined && { primaryPhysician }),
      ...(medicalHistory !== undefined && { medicalHistory }),
      isFirstLogin: false,
    },
  });

  const { password: _, ...userWithoutPassword } = updatedUser;
  return sendSuccess(res, 'Medical profile updated successfully', {
    user: userWithoutPassword,
  });
});
