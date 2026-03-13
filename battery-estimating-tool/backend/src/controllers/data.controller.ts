import { Request, Response } from 'express';
import { db } from '../db';
import { models } from '../db/schema';
import { asc, desc, eq, and, ilike, gte, lte, SQL } from 'drizzle-orm';

const SORTABLE_COLUMNS = [
    'weightedError', 'allCells', 'blindCells', 'nonBlindedCells',
    'charging', 'payload80kg', 'payload448kgWithHvac', 'payload448kgNoHvac',
    'payload1000kg', 'standardCycles', 'customCycles',
    'nMinus20C', 'nMinus10C', 'zeroC', 'tenC', 'twentyFiveC', 'fortyC',
    'isocError', 'currentSensorError',
    'allDriveCyclesAvgRmse', 'allDriveCyclesAvgMae', 'allDriveCyclesAvgMaxe',
    'createdAt', 'name'
] as const;

type SortableColumn = typeof SORTABLE_COLUMNS[number];

export const fetchLeaderboardData = async (req: Request, res: Response) => {
    const {
        // Default values for the query params 
        limit = '20',
        offset = '0',
        order = 'asc',
        sortBy = 'weightedError',
        // Filters -- TODO
        name,
        dateFrom,
        dateTo,
        modelType,
    } = req.query as Record<string, string>;

    // Validate
    const parsedLimit = Math.min(Math.max(parseInt(limit), 1), 100); // clamp 1-100
    const parsedOffset = Math.max(parseInt(offset), 0);

    if (isNaN(parsedLimit) || isNaN(parsedOffset)) {
        return res.status(400).json({ error: 'Limit and/or offset must be numbers' });
    }

    if (order !== 'asc' && order !== 'desc') {
        return res.status(400).json({ error: 'Order must be either asc or desc' });
    }

    if (!SORTABLE_COLUMNS.includes(sortBy as SortableColumn)) {
        return res.status(400).json({ error: `SortBy must be one of: ${SORTABLE_COLUMNS.join(', ')}` });
    }

    // Build filters dynamically
    const filters: SQL[] = [
        eq(models.isPrivate, false),
        eq(models.alreadyEvaluated, true),
    ];

    if (name) {
        filters.push(ilike(models.name, `%${name}%`));  // case-insensitive partial match
    }
    if (dateFrom) {
        filters.push(gte(models.createdAt, new Date(dateFrom)));
    }
    if (dateTo) {
        filters.push(lte(models.createdAt, new Date(dateTo)));
    }
    if (modelType) {
        filters.push(eq(models.modelType, modelType as any));
    }

    const column = models[sortBy as SortableColumn];
    const orderFn = order === 'asc' ? asc : desc;

    const data = await db
        .select()
        .from(models)
        .where(and(...filters))
        .orderBy(orderFn(column))
        .limit(parsedLimit)
        .offset(parsedOffset);

    return res.json({ data, limit: parsedLimit, offset: parsedOffset, order: order, sortBy: sortBy, results: data.length });
};


// Get a model by id
export const fetchModelData = async (req: Request, res: Response) => {
  const id  = req.params.id as string;

  const parsedId = parseInt(id);
  if (isNaN(parsedId)) {
    return res.status(400).json({ error: 'Model ID must be a number' });
  }

  try {
    const data = await db
      .select()
      .from(models)
      .where(eq(models.id, parsedId))
      .limit(1);

    if (data.length === 0) {
      return res.status(404).json({ error: 'Model not found' });
    }

    return res.json({ data: data[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};