import { Request, Response } from 'express';
import { db } from '../db';
import { models, user } from '../db/schema';
import { asc, desc, eq, and, ilike, gte, lte, SQL, getTableColumns } from 'drizzle-orm';
import { modelTypeEnum } from '@/db/schema';
import { logger } from '@/services/logger.service';

type ModelType = typeof modelTypeEnum.enumValues[number];
const VALID_MODEL_TYPES = modelTypeEnum.enumValues;

// The columns that the data can be sorted by when fetching data
const SORTABLE_COLUMNS = [
    'weightedError', 'allCells', 'blindCells', 'nonBlindedCells',
    'charging', 'payload80kg', 'payload448kgWithHvac', 'payload448kgNoHvac',
    'payload1000kg', 'standardCycles', 'customCycles',
    'nMinus20C', 'nMinus10C', 'zeroC', 'tenC', 'twentyFiveC', 'fortyC',
    'isocError', 'currentSensorError',
    'allDriveCyclesAvgRmse', 'allDriveCyclesAvgMae', 'allDriveCyclesAvgMaxe',
    'createdAt', 'name'
] as const;

// Creates a type for Sortable Columns for type safety
type SortableColumn = typeof SORTABLE_COLUMNS[number];

/**
 * Fetches leaderboard data with pagination, sorting, and optional filtering.
 *
 * This endpoint queries the `models` table and returns publicly visible,
 * already-evaluated models. Results can be paginated, sorted, and filtered
 * via query parameters.
 *
 * @param req - Express request object containing query parameters.
 * @param res - Express response object used to return JSON data or errors.
 *
 * @queryParam limit - Maximum number of results to return (default: "20", clamped between 1–100).
 * @queryParam offset - Number of results to skip for pagination (default: "0", minimum: 0).
 * @queryParam order - Sort order, either `"asc"` or `"desc"` (default: `"asc"`).
 * @queryParam sortBy - Column to sort by (default: `"weightedError"`). Must be one of `SORTABLE_COLUMNS`.
 * @queryParam name - Optional case-insensitive partial match filter on model name.                          
 * @queryParam dateFrom - Optional ISO date string; filters results with `createdAt >= dateFrom`.           
 * @queryParam dateTo - Optional ISO date string; filters results with `createdAt <= dateTo`.             
 * @queryParam modelType - Optional filter by model type.                                                   
 *
 * @returns A JSON response containing:
 * - `data`: Array of models matching the query
 * - `limit`: The applied result limit
 * - `offset`: The applied offset
 * - `order`: The applied sort order
 * - `sortBy`: The applied sort column
 * - `results`: Number of results returned
 *
 * @throws {400} If:
 * - `limit` or `offset` are not valid numbers
 * - `order` is not `"asc"` or `"desc"`
 * - `sortBy` is not included in `SORTABLE_COLUMNS`
 *
 * @remarks
 * - Results are always filtered to exclude private or non-evaluated models.
 * - Filtering conditions are composed dynamically based on provided query parameters.
 * - Pagination is implemented using SQL `LIMIT` and `OFFSET`.
 */
export const fetchLeaderboardData = async (req: Request, res: Response) => {
    const {
        // Default values for the query params 
        limit = '20',
        offset = '0',
        order = 'asc',
        sortBy = 'weightedError',
        // Filters
        name,
        dateFrom,
        dateTo,
        modelType,
    } = req.query as Record<string, string>;

    const userId = (req as any).user?.id;

    // Clamp limit to 0-100
    const parsedLimit = Math.min(Math.max(parseInt(limit), 1), 100);
    // Parse offset
    const parsedOffset = Math.max(parseInt(offset), 0);
    // Check if NaN
    if (isNaN(parsedLimit) || isNaN(parsedOffset)) {
        logger.warn('data/leaderboard - Invalid pagination params', { limit, offset, ip: req.ip, userId });
        return res.status(400).json({ error: 'limit and offset must be valid numbers' });
    }

    // Check if valid order
    if (order !== 'asc' && order !== 'desc') {
        logger.warn('data/leaderboard - Invalid order param', { order, ip: req.ip, userId });
        return res.status(400).json({ error: 'Order must be either asc or desc' });
    }

    // Check if sortBy is valid
    if (!SORTABLE_COLUMNS.includes(sortBy as SortableColumn)) {
        logger.warn('data/leaderboard - Invalid sortBy param', { sortBy, ip: req.ip, userId });
        return res.status(400).json({ error: `SortBy must be one of: ${SORTABLE_COLUMNS.join(', ')}` });
    }

    // Check if name is <100 characters
    if (name !== undefined && name.length > 100) {
        logger.warn('data/leaderboard - name filter too long', { nameLength: name.length, ip: req.ip, userId });
        return res.status(400).json({ error: 'name must be 100 characters or fewer' });
    }

    // Parse date filters
    let parsedDateFrom: Date | undefined;
    let parsedDateTo: Date | undefined;

    if (dateFrom !== undefined) {
        parsedDateFrom = new Date(dateFrom);
        if (isNaN(parsedDateFrom.getTime())) {
            logger.warn('data/leaderboard - Invalid dateFrom', { dateFrom, ip: req.ip, userId });
            return res.status(400).json({ error: 'dateFrom must be a valid ISO date string' });
        }
    }

    if (dateTo !== undefined) {
        parsedDateTo = new Date(dateTo);
        if (isNaN(parsedDateTo.getTime())) {
            logger.warn('data/leaderboard - Invalid dateTo', { dateTo, ip: req.ip, userId });
            return res.status(400).json({ error: 'dateTo must be a valid ISO date string' });
        }
    }

    // Check if dates are valid range
    if (parsedDateFrom && parsedDateTo && parsedDateFrom > parsedDateTo) {
        logger.warn('data/leaderboard - Invalid date range', { dateFrom, dateTo, ip: req.ip, userId });
        return res.status(400).json({ error: 'dateFrom must be before dateTo' });
    }

    // Check if valid model type 
    if (modelType !== undefined && !VALID_MODEL_TYPES.includes(modelType as ModelType)) {
        logger.warn('data/leaderboard - Invalid modelType', { modelType, ip: req.ip, userId });
        return res.status(400).json({ error: `modelType must be one of: ${VALID_MODEL_TYPES.join(', ')}` });
    }

    // Only return public models that have been evaluated 
    const filters: SQL[] = [
        eq(models.isPrivate, false),
        eq(models.alreadyEvaluated, true),
    ];

    // Push filters
    if (name) filters.push(ilike(models.name, `%${name}%`));
    if (parsedDateFrom) filters.push(gte(models.createdAt, parsedDateFrom));
    if (parsedDateTo) filters.push(lte(models.createdAt, parsedDateTo));
    if (modelType) filters.push(eq(models.modelType, modelType as ModelType));

    const column = models[sortBy as SortableColumn];
    const orderFn = order === 'asc' ? asc : desc;

    // Query db
    try {
        const data = await db
            .select()
            .from(models)
            .where(and(...filters))
            .orderBy(orderFn(column))
            .limit(parsedLimit)
            .offset(parsedOffset);

        logger.info('data/leaderboard - Query successful', { results: data.length, filters: { name, modelType, dateFrom, dateTo }, sortBy, order, limit: parsedLimit, offset: parsedOffset, userId });
        return res.json({ data, limit: parsedLimit, offset: parsedOffset, order, sortBy, results: data.length });
    } catch (err) {
        logger.error('data/leaderboard - DB query failed', { err, ip: req.ip, userId });
        return res.status(500).json({ error: 'Internal server error' });
    }
};
export const fetchUserModelJoin = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    const {
        limit = '20',
        offset = '0',
    } = req.query as Record<string, string>;

    const parsedLimit = Math.min(Math.max(parseInt(limit), 1), 100);
    const parsedOffset = Math.max(parseInt(offset), 0);

    if (isNaN(parsedLimit) || isNaN(parsedOffset)) {
        logger.warn('data/user-model-join - Invalid pagination params', { limit, offset, ip: req.ip, userId });
        return res.status(400).json({ error: 'limit and offset must be valid numbers' });
    }

    try {
        const data = await db
            .select({
                // User fields
                userId: user.id,
                userName: user.name,
                firstName: user.first_name,
                lastName: user.last_name,
                academicAffiliation: user.academic_affiliation,
                // All model fields
                ...getTableColumns(models),
            })
            .from(user)
            .innerJoin(models, eq(models.userId, user.id))
            .limit(parsedLimit)
            .offset(parsedOffset);

        logger.info('data/user-model-join - Query successful', { results: data.length, limit: parsedLimit, offset: parsedOffset, userId });
        return res.json({ data, limit: parsedLimit, offset: parsedOffset, results: data.length });
    } catch (err) {
        logger.error('data/user-model-join - DB query failed', { err, ip: req.ip, userId });
        return res.status(500).json({ error: 'Internal server error' });
    }
};
/**
 * Fetches a single model by its ID.
 *
 * @param req - Express request object containing the model ID as a route parameter.
 * @param res - Express response object used to return JSON data or errors.
 *
 * @routeParam id - The numeric ID of the model to fetch.
 *
 * @returns A JSON response containing:
 * - `data`: The model object matching the given ID.
 *
 * @throws {400} If `id` is not a valid number.
 * @throws {403} If a model exists, but `isPrivate==true` and it is not owned by the user
 * @throws {404} If no model exists with the given ID.
 * @throws {500} If an unexpected database error occurs.
 */
export const fetchModelData = async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const userId = (req as any).user?.id;


    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
        logger.warn('data/model - Invalid model ID', { id, ip: req.ip, userId });
        return res.status(400).json({ error: 'Model ID must be a number' });
    }

    try {
        const data = await db
            .select()
            .from(models)
            .where(eq(models.id, parsedId))
            .limit(1);

        if (data.length === 0) {
            logger.warn('data/model - Model not found', { modelId: parsedId, ip: req.ip, userId });
            return res.status(404).json({ error: 'Model not found' });
        }

        const model = data[0];

        // If model is private, only the owner can view it
        if (model.isPrivate && model.userId !== userId) {
            logger.warn('data/model - Unauthorized access to private model', { modelId: parsedId, ip: req.ip, userId });
            return res.status(403).json({ error: 'Forbidden' });
        }

        return res.json({ data: model });
    } catch (err) {
        logger.error('data/model - DB query failed', { err, modelId: parsedId, ip: req.ip, userId });
        return res.status(500).json({ error: 'Internal server error' });
    }
};