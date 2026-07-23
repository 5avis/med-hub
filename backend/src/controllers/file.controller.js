import asyncHandler from 'express-async-handler';
import path from 'path';
import fs from 'fs';
import prisma from '../config/db.js';
import { analyzeScanAndGenerateReport } from '../utils/aiAnalyzer.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * @desc    Upload medical image/scan, trigger AI analysis & generate report
 * @route   POST /api/upload/image
 * @access  Protected (Full Access Only)
 */
export const uploadImage = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    return sendError(res, 'No image file uploaded', 400);
  }

  // Get full user details for report generation
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
  });

  if (!user) {
    return sendError(res, 'User record not found', 404);
  }

  // Perform Mock AI Analysis & Generate TXT Report
  const { analysisResult, reportPath } = await analyzeScanAndGenerateReport(file, user);

  // Determine fileType
  const ext = path.extname(file.originalname).toLowerCase();
  let fileType = 'image';
  if (['.dcm', '.dicom'].includes(ext)) fileType = 'DICOM';
  else if (file.originalname.toLowerCase().includes('mri')) fileType = 'MRI';
  else if (file.originalname.toLowerCase().includes('ct')) fileType = 'CT';
  else if (file.originalname.toLowerCase().includes('xray')) fileType = 'X-Ray';

  const relativeFilePath = path.relative(process.cwd(), file.path).replace(/\\/g, '/');

  // Save metadata & analysis results to PostgreSQL
  const medicalFile = await prisma.medicalFile.create({
    data: {
      userId: user.id,
      originalName: file.originalname,
      filename: file.filename,
      mimeType: file.mimetype || 'application/octet-stream',
      size: file.size,
      fileType,
      filePath: relativeFilePath,
      reportPath,
      analysisResult: JSON.stringify(analysisResult),
    },
  });

  return sendSuccess(
    res,
    'Medical scan uploaded and analyzed successfully',
    {
      file: {
        id: medicalFile.id,
        originalName: medicalFile.originalName,
        filename: medicalFile.filename,
        fileType: medicalFile.fileType,
        size: medicalFile.size,
        filePath: medicalFile.filePath,
        reportPath: medicalFile.reportPath,
        createdAt: medicalFile.createdAt,
      },
      analysisResult,
    },
    201
  );
});

/**
 * @desc    Retrieve all medical files for authenticated user with pagination and filtering
 * @route   GET /api/files
 * @access  Protected (Full Access & Read Only)
 */
export const getFiles = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const { fileType } = req.query;
  const skip = (page - 1) * limit;

  // Filter criteria: match user's ID
  const where = {
    userId: req.user.userId,
    ...(fileType && {
      fileType: {
        equals: fileType,
        mode: 'insensitive',
      },
    }),
  };

  const [files, totalFiles] = await Promise.all([
    prisma.medicalFile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        originalName: true,
        filename: true,
        fileType: true,
        mimeType: true,
        size: true,
        filePath: true,
        reportPath: true,
        analysisResult: true,
        createdAt: true,
      },
    }),
    prisma.medicalFile.count({ where }),
  ]);

  // Parse JSON analysis result for client
  const parsedFiles = files.map((file) => ({
    ...file,
    analysisResult: typeof file.analysisResult === 'string' ? JSON.parse(file.analysisResult) : file.analysisResult,
  }));

  const totalPages = Math.ceil(totalFiles / limit);

  return sendSuccess(res, 'Medical files retrieved successfully', {
    files: parsedFiles,
    pagination: {
      totalFiles,
      currentPage: page,
      totalPages,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
});

/**
 * @desc    Retrieve detailed metadata and analysis results for a specific file
 * @route   GET /api/files/:id
 * @access  Protected (Full Access & Read Only)
 */
export const getFileById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const file = await prisma.medicalFile.findUnique({
    where: { id },
  });

  if (!file) {
    return sendError(res, 'Medical file not found', 404);
  }

  // Ownership security check
  if (file.userId !== req.user.userId) {
    return sendError(res, 'Access denied. You can only view your own medical records.', 403);
  }

  const parsedAnalysis = typeof file.analysisResult === 'string' ? JSON.parse(file.analysisResult) : file.analysisResult;

  return sendSuccess(res, 'File details retrieved successfully', {
    file: {
      ...file,
      analysisResult: parsedAnalysis,
    },
  });
});

/**
 * @desc    Download medical scan image or generated TXT report (Full Access Only)
 * @route   GET /api/files/:id/download
 * @access  Protected (Full Access Only)
 */
export const downloadFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type } = req.query; // 'report' or 'image' (default: image)

  const file = await prisma.medicalFile.findUnique({
    where: { id },
  });

  if (!file) {
    return sendError(res, 'Medical file not found', 404);
  }

  // Ownership check
  if (file.userId !== req.user.userId) {
    return sendError(res, 'Access denied. You can only download your own files.', 403);
  }

  const relativeTarget = type === 'report' ? file.reportPath : file.filePath;
  const absolutePath = path.resolve(process.cwd(), relativeTarget);

  if (!fs.existsSync(absolutePath)) {
    return sendError(res, `Requested ${type === 'report' ? 'report' : 'image'} file does not exist on disk`, 404);
  }

  const downloadFilename = type === 'report' 
    ? `MEDHUB-REPORT-${file.originalName}.txt` 
    : file.originalName;

  res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
  if (type === 'report') {
    res.setHeader('Content-Type', 'text/plain');
  } else {
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
  }

  const fileStream = fs.createReadStream(absolutePath);
  fileStream.pipe(res);
});
