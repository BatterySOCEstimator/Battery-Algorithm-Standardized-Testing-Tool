import { Request, Response, NextFunction } from 'express';
import 'dotenv/config'
import { config } from '@/config/app.config';
// File imports
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
// DB imports
import { db } from '../db';
import { models } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// Only allow Python and MATLAB files
const ALLOWED_EXTENSIONS = config.upload.allowedExtensions;
const ALLOWED_MIMETYPES = config.upload.allowedMimetypes;

// Configure where and how files are saved on disk
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    // Pull user and model name to build a scoped upload path
    // const userId = "e61tIWQu45pnJew9tti6zaY5FYIBuK0f" // FOR TESTING
    const userId = (req as any).user?.id;
    const modelName = req.body.name;

    if (!userId) return cb(new Error('No User found.'), '');
    if (!modelName) return cb(new Error('Model name is required.'), '');

    // Save files to uploads/unprocessed/{userId}/{modelName}
    const dir = path.join(process.env.UPLOAD_DIR ?? './uploads', 'unprocessed', userId, modelName);

    // Create the directory if it doesn't exist
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      return cb(new Error('Failed to create upload directory.'), '');
    }

    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    // Keep the original filename since files are scoped to their own directory
    cb(null, file.originalname);
  },
});

// Reject files that aren't Python or MATLAB
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Check extension first, fall back to MIME type
  if (ALLOWED_EXTENSIONS.includes(ext) || ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only Python (.py) and MATLAB (.m) files are allowed.`));
  }
};

// Multer instance: max 10 files, 1MB each, scoped to the 'files' field name
const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSizeMb },
  fileFilter,
}).array('files', config.upload.maxFiles);

// Wrap multer so its errors return JSON instead of crashing the request
export const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Handle known multer errors (size limit, unexpected field, etc.)
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 1MB.' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      // Handle custom errors from fileFilter and destination
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

export const checkModelNameUnique = async (req: Request, res: Response, next: NextFunction) => {
  const name = req.query.name as string;
  const userId = (req as any).user?.id ?? 'e61tIWQu45pnJew9tti6zaY5FYIBuK0f'; // For testing

  if (!name) {
    res.status(400).json({ error: 'Model name is required.' });
    return;
  }

  const existing = await db
    .select()
    .from(models)
    .where(and(eq(models.name, name), eq(models.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: `A model named "${name}" already exists.` });
    return;
  }

  next();
};