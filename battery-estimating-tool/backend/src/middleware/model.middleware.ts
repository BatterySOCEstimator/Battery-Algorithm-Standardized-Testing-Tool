import { Request, Response, NextFunction } from 'express';
import 'dotenv/config'
import { config } from '@/config/app.config';
// File imports
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
// DB imports
import { db } from '@/db';
import { models } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/services/logger.service';

// Only allow Python and MATLAB files
const ALLOWED_EXTENSIONS = config.upload.allowedExtensions;
const ALLOWED_MIMETYPES = config.upload.allowedMimetypes;

/**
 * Multer disk storage configuration.
 *
 * Files are saved to `UPLOAD_DIR/{userId}/{modelName}/`.
 * The directory is created if it does not already exist.
 *
 * Requires `req.user.id` (set by auth middleware) and `req.body.name` to be present —
 * if either is missing, the upload is rejected with an error.
 *
 * @remarks
 * Files are stored using their original filename. If two files with the same name
 * are uploaded to the same directory, the second will silently overwrite the first.
 */
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {

    const userId = (req as any).user?.id;
    const modelName = req.body.name;

    if (!userId) return cb(new Error('No User found.'), '');
    if (!modelName) return cb(new Error('Model name is required.'), '');

    // Save files to uploads/{userId}/{modelName}
    const dir = path.join(process.env.UPLOAD_DIR ?? './uploads', userId, modelName);

    // Create the directory
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

/**
 * Multer file filter that only allows Python (`.py`) and MATLAB (`.m`) files.
 * Validates by file extension first, falling back to MIME type.
 * Rejects all other file types with an error.
 */
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ALLOWED_EXTENSIONS.includes(ext) || ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only Python (.py) and MATLAB (.m) files are allowed.`));
  }
};

/**
 * Configured Multer instance.
 * - Accepts up to `config.upload.maxFiles` files per request under the `files` field.
 * - Enforces a per-file size limit of `config.upload.maxFileSizeMb`.
 * - Applies {@link fileFilter} to reject non-Python/MATLAB files.
 */
const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSizeMb * 1024 * 1024 },
  fileFilter,
}).array('files', config.upload.maxFiles);

/**
 * Middleware that handles multipart file uploads via Multer.
 *
 * Wraps the Multer `upload` handler to ensure all errors — both Multer-specific
 * and custom errors from `fileFilter` and `destination` — are returned as JSON
 * rather than crashing the request.
 *
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next function, called if the upload succeeds.
 *
 * @throws {400} If a Multer error occurs (e.g. file too large, unexpected field).
 * @throws {400} If a custom error occurs (e.g. invalid file type, missing user or model name).
 */
export const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Handle known multer errors (size limit, unexpected field, etc.)
      if (err.code === 'LIMIT_FILE_SIZE') {
        logger.warn('uploadMiddleware - File too large', { ip: req.ip, userId: (req as any).user?.id });
        return res.status(400).json({ error: 'File too large. Maximum size is 1MB.' });
      }
      logger.warn('uploadMiddleware - Multer error', { error: err.message, ip: req.ip, userId: (req as any).user?.id });
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      // Handle custom errors from fileFilter and destination
      logger.warn('uploadMiddleware - Upload rejected', { error: err.message, ip: req.ip, userId: (req as any).user?.id });
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

/**
 * Middleware that ensures a model name is unique per user before proceeding.
 *
 * Must be applied BEFORE {@link uploadMiddleware} so that files are only written
 * to disk if the name passes the uniqueness check.
 *
 * Expects `req.user` to be populated — apply {@link requireAuth} before this middleware.
 *
 * @param req - Express request object. Expects:
 *   - `req.query.name` — The model name to check (required query parameter).
 *     Must match the `name` field sent in the multipart form body so that the
 *     uniqueness check and the saved file path stay in sync.
 *   - `req.user.id` — ID of the authenticated user (set by auth middleware).
 * @param res - Express response object used to return errors.
 * @param next - Express next function, called only if the name is unique.
 *
 * @throws {400} If `name` query parameter is not provided.
 * @throws {401} If `req.user.id` is missing.
 * @throws {409} If a model with the given name already exists for this user.
 * @throws {500} If the database query fails.
 *
 * @example
 * // Name must be passed as a query param before the multipart body:
 * POST /api/model/upload?name=MyModel
 */
export const checkModelNameUnique = async (req: Request, res: Response, next: NextFunction) => {

  const userId = (req as any).user?.id;

  // Check if there is a userId
  if (!userId) {
    logger.warn('checkModelNameUnique - Unauthorized', { ip: req.ip, method: req.method, path: req.path });
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const name = req.query.name as string;

  // Check if there is a name
  if (!name) {
    logger.warn('checkModelNameUnique - Missing name query param', { ip: req.ip, userId });
    res.status(400).json({ error: 'Model name is required.' });
    return;
  }

  try {
    const existing = await db
      .select()
      .from(models)
      .where(and(eq(models.name, name), eq(models.userId, userId)))
      .limit(1);

    // If a result is returned, then there is already a name with 
    if (existing.length > 0) {
      logger.warn('checkModelNameUnique - Duplicate model name', { name, userId, ip: req.ip });
      res.status(409).json({ error: `A model named "${name}" already exists.` });
      return;
    }

    next();
  } catch (err) {
    logger.error('checkModelNameUnique - DB query failed', { err, userId, ip: req.ip });
    res.status(500).json({ error: 'Internal server error' });
  }
};