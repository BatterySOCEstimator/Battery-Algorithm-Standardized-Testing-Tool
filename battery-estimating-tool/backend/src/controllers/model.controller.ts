import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
import { models, modelTypeEnum } from '../db/schema';
import { and, eq } from 'drizzle-orm';
import { sendEmail } from '@/services/email.service';

/**
 * Handles model file upload and registers the model in the database.
 *
 * Expects a multipart/form-data request with one or more files and body fields
 * describing the model. On success, inserts a new model record with a `pending`
 * status and sends a confirmation email to the authenticated user.
 *
 * @param req - Express request object. Must include:
 *   - `req.files` — One or more uploaded files (via Multer).
 *   - `req.user.id` — ID of the authenticated user (set by auth middleware).
 *   - `req.user.email` — Email of the authenticated user (set by auth middleware).
 *   - `req.body.name` — Name of the model (required).
 *   - `req.body.description` — Description of the model (required).
 *   - `req.body.isPrivate` — Whether the model is private (optional, defaults to false).
 *   - `req.body.modelType` — Type of the model (optional, defaults to `"Not Specified"`).
 *     Must be one of the values defined in `modelTypeEnum` if provided.
 * @param res - Express response object used to return JSON data or errors.
 *
 * @returns A JSON response containing:
 * - `message`: Success message.
 * - `model`: The newly inserted model record.
 * - `files`: Array of uploaded file metadata (`name`, `size`).
 *
 * @throws {400} If no files are uploaded.
 * @throws {400} If `name` or `description` are missing from the request body.
 * @throws {400} If `modelType` is provided but not a valid enum value.
 * @throws {401} If the request is not authenticated or `req.user.id` is missing.
 * @throws {500} If the database insert fails.
 *
 * @remarks
 * - The model's `filePath` is set to a directory under `UPLOAD_DIR/{userId}/{name}`.
 * - The model's initial `status` is always `"pending"`.
 * - A confirmation email is sent to the user on both success and failure.
 */
export const uploadModel = async (req: Request, res: Response): Promise<void> => {
  const files = req.files as Express.Multer.File[];

  // If no files
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No files uploaded.' });
    return;
  }

  const { name, description, isPrivate, modelType } = req.body;

  // const userId = "e61tIWQu45pnJew9tti6zaY5FYIBuK0f" // FOR TESTING
  const userId = (req as any).user?.id;
  const userEmail = (req as any).user?.email;

  // Check if there is a userId
  if (!userId) {
    res.status(401).json({ error: 'uploadModel: Unauthorized. No userId attached to request' });
    return;
  }

  // Validate modelType
  const VALID_MODEL_TYPES = modelTypeEnum.enumValues;
  type ModelType = typeof modelTypeEnum.enumValues[number];

  if (modelType && !VALID_MODEL_TYPES.includes(modelType as ModelType)) {
    res.status(400).json({ error: `modelType must be one of: ${VALID_MODEL_TYPES.join(', ')}` });
    return;
  }

  // Check if name and description are provided 
  if (!name || !description) {
    res.status(400).json({ error: 'name and description are required.' });
    return;
  }

  // Store the directory path
  const modelDir = path.join(
    process.env.UPLOAD_DIR ?? './uploads',
    userId,
    name
  );

  try {
    // Insert new model in DB
    const [model] = await db.insert(models).values({
      name,
      description,
      isPrivate: isPrivate === 'true' || isPrivate === true,
      userId,
      modelType: modelType ?? 'Not Specified',
      filePath: modelDir,
      status: 'pending',
    }).returning();

    // Send confirmation email
    if (userEmail) {
      void sendEmail(
        userEmail,
        'Model uploaded successfully',
        `<p>Your model <strong>${name}</strong> has been uploaded and is pending evaluation.</p>`
      );
    }

    res.status(201).json({
      message: 'Model uploaded successfully.',
      model,
      files: files.map(f => ({ name: f.originalname, size: f.size })),
    });
  } catch (err) {
    console.error('DB insert failed:', err);

    // Send error email
    if (userEmail) {
      void sendEmail(
        userEmail,
        'Model upload failed',
        `<p>An error occurred while uploading your model <strong>${name}</strong>.</p>`
      );
    }

    res.status(500).json({ error: 'Failed to save model to database.' });
  }
};

/**
 * Deletes a model by ID, removing both the database record and associated files on disk.
 *
 * Only the authenticated user who owns the model can delete it. On success, the model's
 * directory is removed from disk and the record is deleted from the database. A confirmation
 * email is sent to the user on both success and failure.
 *
 * @param req - Express request object. Must include:
 *   - `req.params.id` — Numeric ID of the model to delete (required).
 *   - `req.user.id` — ID of the authenticated user (set by auth middleware).
 *   - `req.user.email` — Email of the authenticated user (set by auth middleware).
 * @param res - Express response object used to return JSON data or errors.
 *
 * @returns A JSON response containing:
 * - `message`: Success message.
 *
 * @throws {400} If `id` is not a valid number.
 * @throws {401} If the request is not authenticated or `req.user.id` is missing.
 * @throws {404} If no model exists with the given ID owned by the authenticated user.
 * @throws {500} If the file deletion or database delete fails.
 *
 * @remarks
 * - Ownership is enforced by querying with both `id` and `userId` — users cannot delete models they don't own.
 * - File deletion uses `fs.rmSync` with `recursive: true`, removing the entire model directory.
 * - If the file path does not exist on disk, the deletion is skipped and the DB record is still removed.
 * - A confirmation email is sent to the user on both success and failure.
 */
export const deleteModel = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?.id;
  const userEmail = (req as any).user?.email;

  // Validate userId
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Parse and validate id
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid model ID.' });
    return;
  }

  // Find the model with specified id owned by user
  const [model] = await db
    .select()
    .from(models)
    .where(and(eq(models.id, id), eq(models.userId, userId)))
    .limit(1);

  // If no model found
  if (!model) {
    res.status(404).json({ error: 'Model not found.' });
    return;
  }

  // Get model name (SHOULD be attached, but default to Unknown just in case)
  const name = model.name ?? 'Unknown Model';

  // Check if filePath is sus to prevent any deletion of folders we don't want to delete :P  
  const expectedBase = path.resolve(process.env.UPLOAD_DIR ?? './uploads', userId);
  const resolvedFilePath = path.resolve(model.filePath);

  if (!resolvedFilePath.startsWith(expectedBase)) {
    console.error(`Suspicious filePath detected: ${model.filePath}`);
    res.status(500).json({ error: 'Invalid model file path.' });
    return;
  }

  try {
    // Delete model from storage
    if (fs.existsSync(model.filePath)) {
      fs.rmSync(model.filePath, { recursive: true, force: true });
    }

    // Delete model from db
    await db.delete(models).where(eq(models.id, id));

    // Send success email
    if (userEmail) {
      void sendEmail(
        userEmail,
        'Model deleted successfully',
        `<p>Your model <strong>${name}</strong> has been deleted.</p>`
      );
    }

    res.status(200).json({ message: 'Model deleted successfully.' });
  } catch (err) {
    console.error('Delete model failed:', err);

    // Send failure email
    if (userEmail) {
      void sendEmail(
        userEmail,
        'Model deletion failed', 
        `<p>An error occurred while deleting your model <strong>${name}</strong>.</p>`
      );
    }

    res.status(500).json({ error: 'Failed to delete model.' });
  }
};

export const test = async (req: Request, res: Response) => {
  const userEmail = (req as any).user.email;
  const firstName = (req as any).user.firstName; // Please work


  if (userEmail) {
    void sendEmail(
      userEmail,
      'Model uploaded successfully',
      `<p>You are named <strong>${firstName}</strong> </p>`
    );
  }
  res.json({ user: { id: 1, email: "test@example.com", name: "Test User" } });
};