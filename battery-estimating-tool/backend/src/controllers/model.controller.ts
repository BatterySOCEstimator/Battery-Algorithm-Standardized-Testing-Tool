import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
import crypto from 'crypto';
import { models, modelTypeEnum, user } from '../db/schema';
import { eq, ilike, or } from 'drizzle-orm';
import { sendEmail } from '@/services/email.service';
import { logger } from '@/services/logger.service';
import { runEvaluatorContainer } from '@/services/evaluator.service';

// Shared with updateModel — keeps upload and edit enforcing the same limits.
const MODEL_NAME_MAX_LENGTH = 50;
const MODEL_DESCRIPTION_MAX_LENGTH = 1000;

/**
 * Handles model file upload and registers the model in the database.
 *
 * Expects a multipart/form-data request with one or more files and body fields
 * describing the model. On success, inserts a new model record with a `pending`
 * status and sends a confirmation email to the authenticated user.
 *
 * @param req - Express request object. Must include:
 *   - `req.files` — One or more uploaded files (via Multer).
 *   - `req.submissionOwner.id` / `.email` — Who the model is attributed to
 *     (set by `resolveSubmissionOwner` — the requester, unless an admin is
 *     submitting on behalf of someone else).
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
 * @throws {400} If `name` exceeds {@link MODEL_NAME_MAX_LENGTH} or `description` exceeds {@link MODEL_DESCRIPTION_MAX_LENGTH} characters.
 * @throws {400} If `modelType` is provided but not a valid enum value.
 * @throws {401} If the request is not authenticated or `req.user.id` is missing.
 * @throws {500} If the database insert fails.
 *
 * @remarks
 * - The model's `filePath` is set to a directory under `UPLOAD_DIR/{userId}/{storageId}`,
 *   with the uploaded file itself under that directory's `model/` subfolder.
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

  const parallelizationLevel = req.body.level ?? 'P0';
  const VALID_LEVELS = ['dynamic', 'P0', 'P1', 'P2'];
  if (!VALID_LEVELS.includes(parallelizationLevel)) {
    res.status(400).json({ error: 'level must be dynamic, P0, P1, or P2.' });
    return;
  }

  // The model's owner — the requester themselves, unless resolveSubmissionOwner
  // resolved an admin's ?onBehalfOfUserId= to someone else. requesterId is
  // kept separately purely for audit logging (who actually performed the
  // upload), never used for ownership/authorization decisions below.
  const userId = (req as any).submissionOwner?.id;
  const userEmail = (req as any).submissionOwner?.email;
  const requesterId = (req as any).user?.id;

  // Check if there is a userId
  if (!userId) {
    logger.warn('model/upload - Unauthorized request', { ip: req.ip, method: req.method, path: req.path });
    res.status(401).json({ error: 'uploadModel: Unauthorized. No userId attached to request' });
    return;
  }

  // Validate modelType
  const VALID_MODEL_TYPES = modelTypeEnum.enumValues;
  type ModelType = typeof modelTypeEnum.enumValues[number];

  if (modelType && !VALID_MODEL_TYPES.includes(modelType as ModelType)) {
    logger.warn('model/upload - Invalid modelType', { modelType, userId, ip: req.ip });
    res.status(400).json({ error: `modelType must be one of: ${VALID_MODEL_TYPES.join(', ')}` });
    return;
  }

  // Check if name and description are provided
  if (!name || !description) {
    logger.warn('model/upload - Missing required fields', { name, description, userId, ip: req.ip });
    res.status(400).json({ error: 'name and description are required.' });
    return;
  }

  // Enforce length limits
  if (name.length > MODEL_NAME_MAX_LENGTH) {
    logger.warn('model/upload - Name too long', { nameLength: name.length, userId, ip: req.ip });
    res.status(400).json({ error: `name must be ${MODEL_NAME_MAX_LENGTH} characters or fewer.` });
    return;
  }
  if (description.length > MODEL_DESCRIPTION_MAX_LENGTH) {
    logger.warn('model/upload - Description too long', { descriptionLength: description.length, userId, ip: req.ip });
    res.status(400).json({ error: `description must be ${MODEL_DESCRIPTION_MAX_LENGTH} characters or fewer.` });
    return;
  }

  // Get file name
  const modelFileName = files?.[0]?.originalname;
  if (!modelFileName) {
    logger.warn('model/upload - Missing file name', { name, description, userId, ip: req.ip });
    res.status(400).json({ error: 'No file provided' });
    return
  }

  // Reuse the storageId uploadMiddleware generated before Multer ran — that's
  // the directory Multer actually wrote the files to, so the controller must
  // use the same value rather than generating its own here.
  const storageId = (req as any).storageId;
  if (!storageId) {
    logger.warn('model/upload - Missing storageId', { name, userId, ip: req.ip });
    res.status(500).json({ error: 'Internal server error' });
    return;
  }

  // Store the directory path
  const modelDir = path.join(
    process.env.UPLOAD_DIR ?? './uploads',
    userId,
    storageId,
  );

  try {

    // Multer wrote the file under modelDir/model (see model.middleware.ts's
    // storage.destination) — the evaluator writes results/ as a sibling of
    // that within modelDir, so modelDir itself stays the storageId root.
    const relativeZipFilePath = path.join(modelDir, 'model', modelFileName);
    const zipFilePath = path.resolve(relativeZipFilePath);

    // Insert new model in DB
    const [model] = await db.insert(models).values({
      name,
      description,
      isPrivate: isPrivate === 'true' || isPrivate === true,
      userId,
      modelType: modelType ?? 'Not Specified',
      storageId,
      filePath: modelDir,
      zipFilePath,
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

    logger.info('model/upload - Model uploaded successfully', { modelId: model.id, modelName: name, userId, requesterId, fileCount: files.length });
    // Send success to client
    res.status(201).json({
      message: 'Model uploaded successfully.',
      model,
      files: files.map(f => ({ name: f.originalname, size: f.size })),
    });

    // Run evaluator 
    void runEvaluation(model.id, modelDir, userId, userEmail, name, parallelizationLevel);

  } catch (err) {
    logger.error('model/upload - DB insert failed', { err, userId, modelName: name, ip: req.ip });

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
 * Lists users an admin can submit a model on behalf of (via `uploadModel`'s
 * `?onBehalfOfUserId=`). Admin-only — enforced by `requireRole('admin')` on
 * the route, not by anything in this controller.
 *
 * Returns only the minimal fields the picker needs — never password/session
 * data (better-auth keeps those in separate tables anyway, but this also
 * avoids returning ban status, etc. that the picker has no use for).
 *
 * @param req - Express request object. Optional `req.query.search` filters
 *   by name/email/username (case-insensitive partial match).
 * @param res - Express response object.
 *
 * @returns `{ users: { id, name, email, username }[] }`, capped at 50 results.
 * @throws {500} If the database query fails.
 */
export const listSubmittableUsers = async (req: Request, res: Response): Promise<void> => {
  const adminId = (req as any).user?.id;
  const search = (req.query.search as string | undefined)?.trim();

  try {
    const filters = search
      ? or(
        ilike(user.name, `%${search}%`),
        ilike(user.email, `%${search}%`),
        ilike(user.username, `%${search}%`),
      )
      : undefined;

    const results = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
      })
      .from(user)
      .where(filters)
      .orderBy(user.name)
      .limit(50);

    logger.info('model/users - Query successful', { adminId, search, results: results.length });
    res.json({ users: results });
  } catch (err) {
    logger.error('model/users - DB query failed', { err, adminId, search, ip: req.ip });
    res.status(500).json({ error: 'Internal server error' });
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
    logger.warn('model/delete - Unauthorized request', { ip: req.ip, method: req.method, path: req.path });
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Parse and validate id
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    logger.warn('model/delete - Invalid model ID', { id: req.params.id, userId, ip: req.ip });
    res.status(400).json({ error: 'Invalid model ID.' });
    return;
  }

  // Find the model by id — ownership is checked separately below (instead
  // of filtering by userId here) so admins can delete models they don't own.
  const [model] = await db
    .select()
    .from(models)
    .where(eq(models.id, id))
    .limit(1);

  // If no model found, or the requester neither owns it nor is an admin —
  // 404 either way, so a non-owner can't tell "doesn't exist" apart from
  // "exists but isn't yours".
  const isAdmin = (req as any).user?.role === 'admin';
  if (!model || (model.userId !== userId && !isAdmin)) {
    logger.warn('model/delete - Model not found', { modelId: id, userId, ip: req.ip });
    res.status(404).json({ error: 'Model not found.' });
    return;
  }

  // Get model name (SHOULD be attached, but default to Unknown just in case)
  const name = model.name ?? 'Unknown Model';

  // Check if filePath is sus to prevent any deletion of folders we don't want
  // to delete :P — based on the model's own owner, not the requester, so an
  // admin deleting someone else's model doesn't trip this on their own path.
  const expectedBase = path.resolve(process.env.UPLOAD_DIR ?? './uploads', model.userId);
  const resolvedFilePath = path.resolve(model.filePath);

  if (!resolvedFilePath.startsWith(expectedBase)) {
    logger.warn('model/delete - Suspicious filePath detected', { filePath: model.filePath, expectedBase, userId, ip: req.ip });
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

    logger.info('model/delete - Model deleted successfully', { modelId: id, modelName: name, userId });
    res.status(200).json({ message: 'Model deleted successfully.' });
  } catch (err) {
    logger.error('model/delete - Failed to delete model', { err, modelId: id, modelName: name, userId, ip: req.ip });

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

/**
 * Updates a model's title, description, type, and/or visibility by ID.
 *
 * Only the authenticated user who owns the model can update it. Any subset
 * of the updatable fields may be provided in the request body — fields that
 * are omitted are left unchanged.
 *
 * @param req - Express request object. Must include:
 *   - `req.params.id` — Numeric ID of the model to update (required).
 *   - `req.user.id` — ID of the authenticated user (set by auth middleware).
 *   - `req.body.name` — New model name (optional).
 *   - `req.body.description` — New model description (optional).
 *   - `req.body.modelType` — New model type (optional). Must be one of the values in `modelTypeEnum` if provided.
 *   - `req.body.isPrivate` — New visibility (optional).
 * @param res - Express response object used to return JSON data or errors.
 *
 * @returns A JSON response containing:
 * - `message`: Success message.
 * - `model`: The updated model record.
 *
 * @throws {400} If `id` is not a valid number.
 * @throws {400} If `modelType` is provided but not a valid enum value.
 * @throws {400} If none of the updatable fields are provided.
 * @throws {401} If the request is not authenticated or `req.user.id` is missing.
 * @throws {404} If no model exists with the given ID owned by the authenticated user.
 * @throws {500} If the database update fails.
 *
 * @remarks
 * - Ownership is enforced by querying with both `id` and `userId` — users cannot update models they don't own.
 * - Only the fields present in the request body are updated; omitted fields are left unchanged.
 */
export const updateModel = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?.id;

  // Validate userId
  if (!userId) {
    logger.warn('model/update - Unauthorized request', { ip: req.ip, method: req.method, path: req.path });
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Parse and validate id
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    logger.warn('model/update - Invalid model ID', { id: req.params.id, userId, ip: req.ip });
    res.status(400).json({ error: 'Invalid model ID.' });
    return;
  }

  // Find the model by id — ownership is checked separately below (instead
  // of filtering by userId here) so admins can edit models they don't own.
  const [model] = await db
    .select()
    .from(models)
    .where(eq(models.id, id))
    .limit(1);

  // If no model found, or the requester neither owns it nor is an admin —
  // 404 either way, so a non-owner can't tell "doesn't exist" apart from
  // "exists but isn't yours".
  const isAdmin = (req as any).user?.role === 'admin';
  if (!model || (model.userId !== userId && !isAdmin)) {
    logger.warn('model/update - Model not found', { modelId: id, userId, ip: req.ip });
    res.status(404).json({ error: 'Model not found.' });
    return;
  }

  const { name, description, modelType, isPrivate } = req.body;

  // Validate modelType, if provided
  const VALID_MODEL_TYPES = modelTypeEnum.enumValues;
  type ModelType = typeof modelTypeEnum.enumValues[number];

  if (modelType !== undefined && !VALID_MODEL_TYPES.includes(modelType as ModelType)) {
    logger.warn('model/update - Invalid modelType', { modelType, modelId: id, userId, ip: req.ip });
    res.status(400).json({ error: `modelType must be one of: ${VALID_MODEL_TYPES.join(', ')}` });
    return;
  }

  // Enforce length limits, same as uploadModel, when the field is provided
  if (name !== undefined && name.length > MODEL_NAME_MAX_LENGTH) {
    logger.warn('model/update - Name too long', { nameLength: name.length, modelId: id, userId, ip: req.ip });
    res.status(400).json({ error: `name must be ${MODEL_NAME_MAX_LENGTH} characters or fewer.` });
    return;
  }
  if (description !== undefined && description.length > MODEL_DESCRIPTION_MAX_LENGTH) {
    logger.warn('model/update - Description too long', { descriptionLength: description.length, modelId: id, userId, ip: req.ip });
    res.status(400).json({ error: `description must be ${MODEL_DESCRIPTION_MAX_LENGTH} characters or fewer.` });
    return;
  }

  // Only touch fields that were actually provided — everything else on the
  // model stays as-is.
  const updates: Partial<typeof models.$inferInsert> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (modelType !== undefined) updates.modelType = modelType;
  if (isPrivate !== undefined) updates.isPrivate = isPrivate === 'true' || isPrivate === true;

  if (Object.keys(updates).length === 0) {
    logger.warn('model/update - No updatable fields provided', { modelId: id, userId, ip: req.ip });
    res.status(400).json({ error: 'No updatable fields provided.' });
    return;
  }

  // Build a message naming the model and exactly what changed, e.g.
  // "Test Coulomb Counter: name, description updated successfully" or
  // "Test Coulomb Counter: Visibility set to private" — used for both the
  // success log and the response. Visibility gets its own phrasing since
  // "set to private/public" reads more naturally than "visibility updated".
  const updatedFields = Object.keys(updates).filter((field) => field !== 'isPrivate');
  const messageParts: string[] = [];
  if (updatedFields.length > 0) {
    messageParts.push(`${updatedFields.join(', ')} updated successfully`);
  }
  if ('isPrivate' in updates) {
    messageParts.push(`Visibility set to ${updates.isPrivate ? 'private' : 'public'}`);
  }
  const successMessage = `${model.name}: ${messageParts.join(', ')}`;

  try {
    // Update model in db
    const [updated] = await db
      .update(models)
      .set(updates)
      .where(eq(models.id, id))
      .returning();

    logger.info(`model/update - ${successMessage}`, { modelId: id, userId, updatedFields: Object.keys(updates) });
    res.status(200).json({ message: successMessage, model: updated });
  } catch (err) {
    logger.error('model/update - Failed to update model', { err, modelId: id, userId, ip: req.ip });
    res.status(500).json({ error: 'Failed to update model.' });
  }
};

/**
 * Sends a test email to the authenticated user and returns a stub user object.
 *
 * Used during development to verify email delivery and auth middleware wiring.
 * Not intended for production use.
 *
 * @param req - Express request object. Must include:
 *   - `req.user.email` — Email of the authenticated user (set by auth middleware).
 *   - `req.user.firstName` — First name of the authenticated user (set by auth middleware).
 * @param res - Express response object.
 *
 * @returns A JSON response with a hardcoded stub user object.
 */
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

/**
 * Downloads a model or results file using a secure token.
 *
 * Looks up the token against both `modelFileToken` and `resultsFileToken`
 * on the models table. If matched, streams the corresponding file to the client.
 *
 * @param req - Express request containing the token in `req.params.token`
 * @param res - Express response used to stream the file
 * @returns 404 if the token is invalid or the file path is missing
 * @returns 500 if an unexpected error occurs
 */
export async function downloadFile(req: Request, res: Response) {
  const token = req.params.token as string;

  logger.info('download - Request received', { token });

  try {
    // Look up the model by either token
    const [row] = await db
      .select()
      .from(models)
      .where(
        or(
          eq(models.modelFileToken, token),
          eq(models.resultsFileToken, token)
        )
      );

    if (!row) {
      logger.warn('download - Invalid token', { token });
      return res.status(404).json({ error: 'Invalid token' });
    }

    // Determine which file is being requested based on which token matched
    const isModelFile = token === row.modelFileToken;
    const filePath = isModelFile ? row.zipFilePath : row.resultsPath;
    const fileName = isModelFile ? 'model.zip' : 'results.zip';

    // File path should always be set if the token exists, but guard just in case
    if (!filePath) {
      logger.warn('download - File path is null', { token, modelId: row.id });
      return res.status(404).json({ error: 'File not found' });
    }

    logger.info('download - Serving file', { modelId: row.id, fileName, userId: row.userId });

    // Stream the file, logging success or failure once the transfer completes
    res.download(filePath, fileName, (err) => {
      if (err) {
        logger.error('download - Failed to stream file', { modelId: row.id, fileName, filePath, err });
      } else {
        logger.info('download - File served successfully', { modelId: row.id, fileName, userId: row.userId });
      }
    });

  } catch (err) {
    logger.error('download - Unexpected error', { token, err });
    return res.status(500).json({ error: 'Internal server error' });
  }
}


/**
 * Streams the shared training data archive to the authenticated user.
 *
 * Resolves the training data zip from a fixed path relative to the project root
 * and sends it as a file download. Any authenticated user may request this file.
 *
 * @param req - Express request object. Must include:
 *   - `req.user.id` — ID of the authenticated user (set by auth middleware).
 *   - `req.user.email` — Email of the authenticated user (set by auth middleware).
 * @param res - Express response object used to stream the file.
 *
 * @returns Streams `training_data.zip` to the client.
 * @throws {500} If an unexpected error occurs while serving the file.
 */
export async function downloadTrainingData(req: Request, res: Response) {

  const userId = (req as any).user?.id;
  const userEmail = (req as any).user?.email;

  logger.info('downloadTrainingData - Request received', { userId, userEmail });

  try {

    // Path to training data file 
    const filePath = path.resolve("..//training_data.zip");
    const fileName = 'training_data.zip';

    logger.info('downloadTrainingData - Serving file', {});

    // Stream the file, logging success or failure once the transfer completes
    res.download(filePath, fileName, (err) => {
      if (err) {
        logger.error('download - Failed to stream file', { userId, userEmail, fileName, filePath, err });
      } else {
        logger.info('download - File served successfully', { userId, userEmail, fileName, filePath });
      }
    });

  } catch (err) {
    logger.error('downloadTrainingData - Unexpected error', { userId, userEmail, err });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Runs the Python evaluation inside a sandboxed Docker container and saves
 * the results to the database.
 *
 * @param modelId - The database ID of the model being evaluated
 * @param modelDir - The directory containing the model files
 * @param userId - The ID of the user who owns the model
 * @param userEmail - Optional email address to notify on success or failure
 * @param modelName - The display name of the model used in email notifications
 */
async function runEvaluation(
  modelId: number,
  modelDir: string,
  userId: string,
  userEmail: string | undefined,
  modelName: string,
  parallelizationLevel: string
) {
  logger.info('model/evaluate - Starting evaluation', { modelId, modelDir, userId });

  const result = await runEvaluatorContainer(modelDir, parallelizationLevel);

  // The evaluator returns paths relative to the container mount (/uploads/...)
  // Translate to the host path
  if (result.results_path) {
    const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? './uploads');
    result.results_path = result.results_path.replace('/uploads', uploadDir);
  }

  if (result.error) {
    logger.error('model/evaluate - Evaluation failed', { modelId, userId, message: result.message });

    // Delete the failed model from DB and disk
    try {
      const resolvedDir = path.resolve(modelDir);
      if (fs.existsSync(resolvedDir)) {
        fs.rmSync(resolvedDir, { recursive: true, force: true });
      }
      await db.delete(models).where(eq(models.id, modelId));
      logger.info('model/evaluate - Cleaned up failed model', { modelId, userId });
    } catch (cleanupErr) {
      logger.error('model/evaluate - Cleanup failed', { modelId, userId, err: cleanupErr });
    }

    if (userEmail) {
      void sendEmail(userEmail, 'Model evaluation failed',
        `<p>Your model <strong>${modelName}</strong> could not be evaluated. Please contact the site Administrator.</p>`);
    }
    return;
  }

  logger.info('model/evaluate - Evaluation complete', { modelId, userId, result });

  const {
    results_path: resultsPath,
    Weighted_Error: weightedError,
    All_Drive_Cycles_Average_RMSE: allDriveCyclesAvgRmse,
    All_Drive_Cycles_Average_MAE: allDriveCyclesAvgMae,
    All_Drive_Cycles_Average_MAXE: allDriveCyclesAvgMaxe,
    Complexity: complexity,
  } = result;

  const testScores = result.Test_Scores as number[];
  const [
    allCells, blindCells, nonBlindedCells, charging,
    payload80kg, payload448kgWithHvac, payload448kgNoHvac, payload1000kg,
    standardCycles, customCycles,
    nMinus20C, nMinus10C, zeroC, tenC, twentyFiveC, fortyC,
    isocError, currentSensorError,
  ] = testScores;

  try {
    const modelFileToken = crypto.randomUUID();
    const resultsFileToken = crypto.randomUUID();

    await db
      .update(models)
      .set({
        alreadyEvaluated: true,
        status: 'ready',
        resultsPath,
        weightedError,
        complexity: String(complexity),
        allCells, blindCells, nonBlindedCells, charging,
        payload80kg, payload448kgWithHvac, payload448kgNoHvac, payload1000kg,
        standardCycles, customCycles,
        nMinus20C, nMinus10C, zeroC, tenC, twentyFiveC, fortyC,
        isocError, currentSensorError,
        allDriveCyclesAvgRmse,
        allDriveCyclesAvgMae,
        allDriveCyclesAvgMaxe,
        modelFileToken,
        resultsFileToken,
      })
      .where(eq(models.id, modelId));

    logger.info('model/evaluate - DB updated successfully', { modelId, userId, result, testScores });

    const resultsUrl = `${process.env.BACKEND_URL}/api/model/download/${resultsFileToken}`;

    if (userEmail) {
      void sendEmail(userEmail, 'Model evaluation complete',
        `<p>Your model <strong>${modelName}</strong> has been evaluated.</p>
         <p>Weighted Error: <strong>${weightedError}</strong></p>
         <p>Complexity: <strong>${complexity}</strong></p>
         <p>Download the results <a href="${resultsUrl}">here.</a></p>`);
    }
  } catch (err) {
    logger.error('model/evaluate - Failed to update DB', { modelId, userId, err });
    if (userEmail) {
      void sendEmail(userEmail, 'Model evaluation failed',
        `<p>Your model <strong>${modelName}</strong> was evaluated but results could not be saved.</p>`);
    }
  }
}