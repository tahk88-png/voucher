/**
 * Custom error classes for better error handling
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', public remaining?: number) {
    super(message, 429, 'RATE_LIMIT');
    this.name = 'RateLimitError';
  }
}

/**
 * Handle errors and return appropriate HTTP response
 */
export function handleError(error: unknown): { status: number; error: string; code?: string } {
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      error: error.message,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    // In production, don't expose error details
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      status: 500,
      error: isProduction ? 'Internal server error' : error.message,
    };
  }

  return {
    status: 500,
    error: 'Unknown error',
  };
}
