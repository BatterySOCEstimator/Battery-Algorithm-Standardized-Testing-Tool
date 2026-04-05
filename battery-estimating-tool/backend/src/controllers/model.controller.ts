import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
import crypto from 'crypto';
import { models, modelTypeEnum } from '../db/schema';
import { and, eq, or } from 'drizzle-orm';
import { sendEmail } from '@/services/email.service';
import { logger } from '@/services/logger.service';
import { runEvaluatorContainer } from '@/services/evaluator.service';

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

  // Get file name
  const modelFileName = files?.[0]?.originalname;
  if (!modelFileName) {
    logger.warn('model/upload - Missing file name', { name, description, userId, ip: req.ip });
    res.status(400).json({ error: 'No file provided' });
    return
  }

  // Store the directory path
  const modelDir = path.join(
    process.env.UPLOAD_DIR ?? './uploads',
    userId,
    name,
  );

  try {

    // Path to actual zip file
    const relativeZipFilePath = path.join(modelDir, modelFileName);
    const zipFilePath = path.resolve(relativeZipFilePath);

    // Insert new model in DB
    const [model] = await db.insert(models).values({
      name,
      description,
      isPrivate: isPrivate === 'true' || isPrivate === true,
      userId,
      modelType: modelType ?? 'Not Specified',
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

    logger.info('model/upload - Model uploaded successfully', { modelId: model.id, modelName: name, userId, fileCount: files.length });
    // Send success to client
    res.status(201).json({
      message: 'Model uploaded successfully.',
      model,
      files: files.map(f => ({ name: f.originalname, size: f.size })),
    });

    // Run evaluator 
    void runEvaluation(model.id, modelDir, userId, userEmail, name);

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

  // Find the model with specified id owned by user
  const [model] = await db
    .select()
    .from(models)
    .where(and(eq(models.id, id), eq(models.userId, userId)))
    .limit(1);

  // If no model found
  if (!model) {
    logger.warn('model/delete - Model not found', { modelId: id, userId, ip: req.ip });
    res.status(404).json({ error: 'Model not found.' });
    return;
  }

  // Get model name (SHOULD be attached, but default to Unknown just in case)
  const name = model.name ?? 'Unknown Model';

  // Check if filePath is sus to prevent any deletion of folders we don't want to delete :P  
  const expectedBase = path.resolve(process.env.UPLOAD_DIR ?? './uploads', userId);
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
  modelName: string
) {
  logger.info('model/evaluate - Starting evaluation', { modelId, modelDir, userId });

  const result = await runEvaluatorContainer(modelDir);

  // The evaluator returns paths relative to the container mount (/uploads/...)
  // Translate to the host path
  if (result.results_path) {
    const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? './uploads');
    result.results_path = result.results_path.replace('/uploads', uploadDir);
  }

  if (result.error) {
    logger.error('model/evaluate - Evaluation failed', { modelId, userId, message: result.message });
    if (userEmail) {
      void sendEmail(userEmail, 'Model evaluation failed',
        `<p>Your model <strong>${modelName}</strong> could not be evaluated: ${result.message}</p>`);
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