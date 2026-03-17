import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
import { models } from '../db/schema';
import { and, eq } from 'drizzle-orm';


export const uploadModel = async (req: Request, res: Response): Promise<void> => {
  const files = req.files as Express.Multer.File[];

  // If no files
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No files uploaded.' });
    return;
  }

  const { name, description, isPrivate, modelType } = req.body;
  const userId = "e61tIWQu45pnJew9tti6zaY5FYIBuK0f" // FOR TESTING
  //const userId = (req as any).user.id; // Please work

  if (!name || !description) {
    res.status(400).json({ error: 'name and description are required.' });
    return;
  }

  // Store the directory path, not individual files
  const modelDir = path.join(
    process.env.UPLOAD_DIR ?? './uploads',
    'unprocessed',
    userId,
    name
  );

  try {
    const [model] = await db.insert(models).values({
      name,
      description,
      isPrivate: isPrivate === 'true' || isPrivate === true,
      userId,
      modelType: modelType ?? 'Not Specified',
      filePath: modelDir,
      status: 'pending',
    }).returning();

    res.status(201).json({
      message: 'Model uploaded successfully.',
      model,
      files: files.map(f => ({ name: f.originalname, size: f.size })),
    });
  } catch (err) {
    console.error('DB insert failed:', err);
    res.status(500).json({ error: 'Failed to save model to database.' });
  }
};

export const deleteModel = async (req: Request, res: Response): Promise<void> => {

  const userId = (req as any).user?.id ?? 'e61tIWQu45pnJew9tti6zaY5FYIBuK0f'; // FOR TESTING

  const id = parseInt(req.params.id as string, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid model ID.' });
    return;
  }

  // Find the model
  const [model] = await db
    .select()
    .from(models)
    .where(and(eq(models.id, id), eq(models.userId, userId)))
    .limit(1);

  if (!model) {
    res.status(404).json({ error: 'Model not found.' });
    return;
  }

  try {
    // Delete files from disk
    if (fs.existsSync(model.filePath)) {
      fs.rmSync(model.filePath, { recursive: true, force: true });
    }

    // Delete from DB
    await db.delete(models).where(eq(models.id, id));

    res.status(200).json({ message: 'Model deleted successfully.' });
  } catch (err) {
    console.error('Delete model failed:', err);
    res.status(500).json({ error: 'Failed to delete model.' });
  }
};