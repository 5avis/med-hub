import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sendError } from '../utils/response.js';

// Ensure uploads directory structure exists
const scansDir = path.join(process.cwd(), 'uploads', 'scans');
if (!fs.existsSync(scansDir)) {
  fs.mkdirSync(scansDir, { recursive: true });
}

// Multer Storage Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, scansDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
  },
});

// File Filter accepting DICOM (.dcm) & standard medical images
const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.tiff', '.tif', '.dcm', '.dicom'];
const allowedMimetypes = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/tiff',
  'application/dicom',
  'application/octet-stream', // common fallback for .dcm files
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isValidExt = allowedExtensions.includes(ext);
  const isValidMime = allowedMimetypes.includes(file.mimetype) || file.mimetype === '';

  if (isValidExt && (isValidMime || ext === '.dcm' || ext === '.dicom')) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed formats: ${allowedExtensions.join(', ')}`
      ),
      false
    );
  }
};

export const uploadSingleImage = (req, res, next) => {
  const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  }).single('image');

  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return sendError(res, `Upload error: ${err.message}`, 400);
    } else if (err) {
      return sendError(res, err.message, 400);
    }
    if (!req.file) {
      return sendError(res, 'Please provide an image or scan file in the "image" field', 400);
    }
    next();
  });
};
