import winston from 'winston';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Tell winston about our colors
winston.addColors(colors);

// Define format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define format for development (more readable)
const devFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(
    (info) => {
      const { timestamp, level, message, ...meta } = info;
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta, null, 2)}` : '';
      return `${timestamp} [${level}]: ${message}${metaStr}`;
    }
  )
);

// Define which transports to use
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? format : devFormat,
  }),
];

// In production, also log to files
if (process.env.NODE_ENV === 'production') {
  // All logs
  transports.push(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );

  // Error logs only
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );
}

// Create the logger
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  format,
  transports,
  // Don't exit on uncaught exceptions
  exitOnError: false,
});

// Create a stream for Morgan HTTP logging
export const httpLogStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper functions for structured logging
export const loggers = {
  request: (method: string, url: string, statusCode: number, duration: number, userId?: string) => {
    logger.http('HTTP Request', {
      method,
      url,
      statusCode,
      duration,
      userId,
    });
  },

  security: (event: string, details: Record<string, unknown>, userId?: string) => {
    logger.warn('Security Event', {
      event,
      ...details,
      userId,
    });
  },

  payment: (event: string, amount: number, currency: string, details: Record<string, unknown>) => {
    logger.info('Payment Event', {
      event,
      amount,
      currency,
      ...details,
    });
  },

  fraud: (signal: string, severity: 'low' | 'medium' | 'high', details: Record<string, unknown>) => {
    const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
    logger.log(level, 'Fraud Signal', {
      signal,
      severity,
      ...details,
    });
  },

  database: (operation: string, table: string, duration: number, error?: Error) => {
    if (error) {
      logger.error('Database Error', {
        operation,
        table,
        duration,
        error: error.message,
        stack: error.stack,
      });
    } else {
      logger.debug('Database Operation', {
        operation,
        table,
        duration,
      });
    }
  },

  audit: (action: string, actorId: string, merchantId: string, details: Record<string, unknown>) => {
    logger.info('Audit Log', {
      action,
      actorId,
      merchantId,
      ...details,
    });
  },

  email: (type: string, recipient: string, success: boolean, error?: string) => {
    if (success) {
      logger.info('Email Sent', {
        type,
        recipient,
      });
    } else {
      logger.error('Email Failed', {
        type,
        recipient,
        error,
      });
    }
  },

  external: (service: string, operation: string, success: boolean, duration: number, error?: string) => {
    if (success) {
      logger.info('External Service Call', {
        service,
        operation,
        duration,
      });
    } else {
      logger.error('External Service Failed', {
        service,
        operation,
        duration,
        error,
      });
    }
  },
};

// Export both default and named
export default logger;
