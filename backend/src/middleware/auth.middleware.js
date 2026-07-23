import { verifyToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return sendError(res, 'Authentication failed. Token missing or invalid.', 401);
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired authentication token', 401);
  }
};

/**
 * RBAC Guard: Requires 'full_access' role.
 * Rejects 'read_only' users with 403 Forbidden.
 */
export const requireFullAccess = (req, res, next) => {
  if (!req.user || req.user.role !== 'full_access') {
    return sendError(
      res,
      'Access denied. Read-only users cannot upload, modify, or download files/reports.',
      403
    );
  }
  next();
};
