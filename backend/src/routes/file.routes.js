import { Router } from 'express';
import { uploadImage, getFiles, getFileById, downloadFile } from '../controllers/file.controller.js';
import { authenticateToken, requireFullAccess } from '../middleware/auth.middleware.js';
import { uploadSingleImage } from '../middleware/upload.middleware.js';
import { validate, fileQuerySchema } from '../middleware/validate.middleware.js';

const router = Router();

/**
 * @route POST /api/upload/image
 * @desc  Upload a medical image/scan (Full Access Only)
 */
router.post('/upload/image', authenticateToken, requireFullAccess, uploadSingleImage, uploadImage);

/**
 * @route GET /api/files
 * @desc  Get all medical files for authenticated user with pagination & filtering (Full Access & Read Only)
 */
router.get('/files', authenticateToken, validate(fileQuerySchema, 'query'), getFiles);

/**
 * @route GET /api/files/:id
 * @desc  Get specific file details & AI analysis result (Full Access & Read Only)
 */
router.get('/files/:id', authenticateToken, getFileById);

/**
 * @route GET /api/files/:id/download
 * @desc  Stream medical scan file or TXT report for download (Full Access Only)
 */
router.get('/files/:id/download', authenticateToken, requireFullAccess, downloadFile);

export default router;
