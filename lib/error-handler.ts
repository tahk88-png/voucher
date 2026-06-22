import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from './logger';
import { captureException } from './error-tracking';
import { AccessControlError } from './access-control/guards';
import { AppError as LegacyAppError } from './errors';
import { CircuitBreakerError } from './circuit-breaker';
import { recordHttpRequest } from './metrics';

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
  requestId?: string;
}

/**
 * Custom application errors with status codes
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details?: unknown) {
    super(message, 401, 'UNAUTHORIZED', details);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details?: unknown) {
    super(message, 403, 'FORBIDDEN', details);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: unknown) {
    super(message, 404, 'NOT_FOUND', details);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', details?: unknown) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', details);
    this.name = 'RateLimitError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details?: unknown) {
    super(message, 409, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

export class StepUpRequiredError extends AppError {
  constructor(message = 'Step-up authentication required', details?: unknown) {
    super(message, 428, 'STEP_UP_REQUIRED', details);
    this.name = 'StepUpRequiredError';
  }
}

/**
 * Centralized error handler for API routes
 * Usage:
 * ```typescript
 * export async function GET(req: NextRequest) {
 *   return withErrorHandler(async () => {
 *     // Your route logic here
 *     return NextResponse.json({ data: 'success' });
 *   });
 * }
 * ```
 */
export async function withErrorHandler<T>(
  handler: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T | NextResponse<ApiErrorResponse>> {
  const startTime = performance.now();
  try {
    const result = await handler();
    const duration = performance.now() - startTime;
    if (result instanceof NextResponse) {
      result.headers.set('Server-Timing', `handler;dur=${duration.toFixed(1)}`);
      recordHttpRequest('handler', 'route', result.status, duration);
    }
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    const response = handleError(error, context);
    response.headers.set('Server-Timing', `handler;dur=${duration.toFixed(1)}`);
    recordHttpRequest('handler', 'route', response.status, duration);
    return response;
  }
}

/**
 * Handle and format errors consistently
 */
export function handleError(
  error: unknown,
  context?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  // Generate request ID for tracking
  const requestId = crypto.randomUUID();

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    logger.warn('Validation error', {
      requestId,
      errors: error.errors,
      ...context,
    });

    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
        requestId,
      },
      { status: 400 }
    );
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    logger.error('Database error', {
      requestId,
      code: error.code,
      meta: error.meta,
      ...context,
    });

    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          error: 'Resource already exists',
          code: 'DUPLICATE_RESOURCE',
          details: error.meta,
          requestId,
        },
        { status: 409 }
      );
    }

    // Handle foreign key constraint failures
    if (error.code === 'P2003') {
      return NextResponse.json(
        {
          error: 'Related resource not found',
          code: 'INVALID_REFERENCE',
          requestId,
        },
        { status: 400 }
      );
    }

    // Handle record not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          error: 'Resource not found',
          code: 'NOT_FOUND',
          requestId,
        },
        { status: 404 }
      );
    }

    // Generic database error
    return NextResponse.json(
      {
        error: 'Database operation failed',
        code: 'DATABASE_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }

  // Handle AccessControlError (uses .status instead of .statusCode)
  if (error instanceof AccessControlError) {
    const level = error.status >= 500 ? 'error' : 'warn';
    logger[level]('Access control error', {
      requestId,
      status: error.status,
      code: error.code,
      message: error.message,
      details: error.details,
      ...context,
    });

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        requestId,
      },
      { status: error.status }
    );
  }

  // Handle circuit breaker errors — service unavailable
  if (error instanceof CircuitBreakerError) {
    logger.warn('Circuit breaker open', {
      requestId,
      message: error.message,
      ...context,
    });

    return NextResponse.json(
      {
        error: 'Service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
        requestId,
      },
      { status: 503 }
    );
  }

  // Handle custom AppErrors
  if (error instanceof AppError) {
    const level = error.statusCode >= 500 ? 'error' : 'warn';
    logger[level]('Application error', {
      requestId,
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details,
      ...context,
    });

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        requestId,
      },
      { status: error.statusCode }
    );
  }

  // Handle the parallel AppError hierarchy in lib/errors.ts (e.g.
  // PaymentRequiredError thrown by lib/billing.ts entitlement guards).
  // These are NOT instanceof THIS module's AppError, so without this block
  // they fell through to the generic 500 below — turning every paywall into
  // a 500 and breaking the client's isPaywallError (status === 402) upgrade
  // prompts. Mirror the AppError handling, preserving statusCode + details.
  if (error instanceof LegacyAppError) {
    const level = error.statusCode >= 500 ? 'error' : 'warn';
    const details = (error as { details?: unknown }).details;
    logger[level]('Application error', {
      requestId,
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details,
      ...context,
    });

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details,
        requestId,
      },
      { status: error.statusCode }
    );
  }

  // Handle standard errors
  if (error instanceof Error) {
    logger.error('Unhandled error', {
      requestId,
      message: error.message,
      stack: error.stack,
      ...context,
    });

    // Capture in error tracking (e.g., Sentry)
    captureException(error, { requestId, ...context });

    // Don't expose internal error details in production
    const message =
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error.message;

    return NextResponse.json(
      {
        error: message,
        code: 'INTERNAL_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }

  // Handle unknown errors
  logger.error('Unknown error type', {
    requestId,
    error: String(error),
    ...context,
  });

  captureException(new Error(`Unknown error: ${String(error)}`), {
    requestId,
    ...context,
  });

  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      requestId,
    },
    { status: 500 }
  );
}

/**
 * Async wrapper that catches errors and doesn't throw
 * Useful for operations that should not fail the main flow
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  fallback: T,
  context?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logger.warn('TryCatch: Operation failed, using fallback', {
      context,
      error: error instanceof Error ? error.message : String(error),
    });
    return fallback;
  }
}

/**
 * Assert a condition, throw ForbiddenError if false
 */
export function assertAuthorized(
  condition: boolean,
  message = 'Unauthorized access'
): asserts condition {
  if (!condition) {
    throw new ForbiddenError(message);
  }
}

/**
 * Assert a resource exists, throw NotFoundError if null/undefined
 */
export function assertExists<T>(
  value: T | null | undefined,
  message = 'Resource not found'
): asserts value is T {
  if (value === null || value === undefined) {
    throw new NotFoundError(message);
  }
}
