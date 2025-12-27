import winston from 'winston';
import { env } from '../env/config.js';

// Define log format
const format = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }), // include stack traces
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  format,
  transports: [
    new winston.transports.Console({
      level: env.NODE_ENV === 'development' ? 'debug' : 'info',
    }),
  ],
});

/**
 * Helper function to create child loggers with context.
 * For example, we can add a `requestId` to all log entries
 *
 * @param context - additional context to be added to the logger
 * @returns logger with additional metadata
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createContextLogger = (context: Record<string, any>) => {
  return logger.child(context);
};
