import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import fs from 'fs';
/**
 * Centralized logger instance using Winston.
 *
 * Logs to console in development and to rotating files in production.
 * All logs include a timestamp and are structured as JSON for easy parsing.
 *
 * Log levels (in order of severity):
 * - error: system errors, unhandled exceptions
 * - warn: failed auth attempts, suspicious activity
 * - info: general application events
 * - http: request/response logging (via Morgan)
 * - debug: verbose dev-only logging
 */
const LOG_DIR = process.env.LOG_DIR ?? 'logs';
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

export const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
                    return `${timestamp} [${level}]: ${message} ${metaStr}`;
                })
            ),
        }),
        // New error log file every day, keep 30 days, compress old ones
        new DailyRotateFile({
            filename: `${LOG_DIR}/error-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxFiles: '30d',
            zippedArchive: true,
        }),
        // New combined log file every day, keep 14 days, compress old ones
        new DailyRotateFile({
            filename: `${LOG_DIR}/combined-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            maxFiles: '14d',
            zippedArchive: true,
        }),
    ],
});

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason });
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { err });
    process.exit(1);
});