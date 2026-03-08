/**
 * Domain Error Classes
 *
 * Standardized error types for business logic and API responses.
 * All domain errors have:
 * - code: Machine-readable error identifier
 * - status: HTTP status code
 * - message: Human-readable message
 *
 * Usage:
 * ```typescript
 * if (!campaign) {
 *   throw new NotFoundError('Campaign not found');
 * }
 *
 * if (!hasPermission) {
 *   throw new ForbiddenError('Access denied');
 * }
 * ```
 *
 * Error handling middleware converts these to standard API responses:
 * ```json
 * {
 *   "ok": false,
 *   "error": {
 *     "code": "NOT_FOUND",
 *     "message": "Campaign not found"
 *   }
 * }
 * ```
 */

/**
 * Base domain error class
 *
 * All business logic errors should extend this.
 */
export abstract class DomainError extends Error {
  abstract readonly code: ErrorCode;
  abstract readonly status: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    // Maintain proper stack trace
    Object.setPrototypeOf(this, DomainError.prototype);
  }

  /**
   * Convert to API response format
   */
  toJSON() {
    return {
      ok: false,
      error: {
        code: this.code,
        message: this.message,
      },
    };
  }
}

/**
 * Error code type for strong typing
 */
export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'TOO_MANY_REQUESTS'
  | 'UNPROCESSABLE_ENTITY'
  | 'INTERNAL_SERVER_ERROR'
  | 'ENTITLEMENT_LIMIT_REACHED'
  | 'PAYMENT_REQUIRED'
  | 'OUT_OF_STOCK'
  | 'INSUFFICIENT_CREDITS'
  | 'INVALID_OPERATION'
  | 'SERVICE_UNAVAILABLE';

// ─── AUTHENTICATION & AUTHORIZATION ───

export class UnauthorizedError extends DomainError {
  readonly code: ErrorCode = 'UNAUTHORIZED';
  readonly status = 401;

  constructor(message = 'Authentication required.') {
    super(message);
  }
}

export class ForbiddenError extends DomainError {
  readonly code: ErrorCode = 'FORBIDDEN';
  readonly status = 403;

  constructor(message = 'Access denied.') {
    super(message);
  }
}

// ─── RESOURCE ERRORS ───

export class NotFoundError extends DomainError {
  readonly code: ErrorCode = 'NOT_FOUND';
  readonly status = 404;

  constructor(message = 'Resource not found.') {
    super(message);
  }
}

export class ConflictError extends DomainError {
  readonly code: ErrorCode = 'CONFLICT';
  readonly status = 409;

  constructor(message = 'Resource conflict.') {
    super(message);
  }
}

// ─── VALIDATION ───

export class ValidationError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly status = 400;

  details?: Record<string, string[]>;

  constructor(message = 'Validation failed.', details?: Record<string, string[]>) {
    super(message);
    this.details = details;
  }

  override toJSON() {
    return {
      ok: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

// ─── ENTITLEMENT & PAYMENT ───

export class EntitlementError extends DomainError {
  readonly code: ErrorCode = 'ENTITLEMENT_LIMIT_REACHED';
  readonly status = 402; // Payment Required

  constructor(message = 'Entitlement limit reached. Upgrade required.') {
    super(message);
  }
}

export class PaymentRequiredError extends DomainError {
  readonly code: ErrorCode = 'PAYMENT_REQUIRED';
  readonly status = 402;

  constructor(message = 'Payment required to proceed.') {
    super(message);
  }
}

export class InsufficientCreditsError extends DomainError {
  readonly code: ErrorCode = 'INSUFFICIENT_CREDITS';
  readonly status = 402;

  constructor(required: number, available: number) {
    super(
      `Insufficient credits. Required: ${required}, Available: ${available}.`
    );
  }
}

// ─── INVENTORY ───

export class OutOfStockError extends DomainError {
  readonly code: ErrorCode = 'OUT_OF_STOCK';
  readonly status = 400;

  constructor(resource = 'Resource') {
    super(`${resource} is out of stock.`);
  }
}

// ─── OPERATIONS ───

export class InvalidOperationError extends DomainError {
  readonly code: ErrorCode = 'INVALID_OPERATION';
  readonly status = 400;

  constructor(message = 'Invalid operation.') {
    super(message);
  }
}

export class UnprocessableEntityError extends DomainError {
  readonly code: ErrorCode = 'UNPROCESSABLE_ENTITY';
  readonly status = 422;

  constructor(message = 'Request contains invalid data.') {
    super(message);
  }
}

// ─── RATE LIMITING ───

export class TooManyRequestsError extends DomainError {
  readonly code: ErrorCode = 'TOO_MANY_REQUESTS';
  readonly status = 429;

  retryAfter?: number;

  constructor(message = 'Too many requests.', retryAfter?: number) {
    super(message);
    this.retryAfter = retryAfter;
  }

  override toJSON() {
    const json = super.toJSON();
    if (this.retryAfter) {
      (json as any).retryAfter = this.retryAfter;
    }
    return json;
  }
}

// ─── SERVICE ERRORS ───

export class ServiceUnavailableError extends DomainError {
  readonly code: ErrorCode = 'SERVICE_UNAVAILABLE';
  readonly status = 503;

  constructor(service = 'Service', message?: string) {
    super(message || `${service} is temporarily unavailable.`);
  }
}

export class InternalServerError extends DomainError {
  readonly code: ErrorCode = 'INTERNAL_SERVER_ERROR';
  readonly status = 500;

  constructor(message = 'Internal server error.') {
    super(message);
  }
}

// ─── ERROR TYPE GUARDS ───

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isForbiddenError(error: unknown): error is ForbiddenError {
  return error instanceof ForbiddenError;
}

export function isUnauthorizedError(error: unknown): error is UnauthorizedError {
  return error instanceof UnauthorizedError;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isTooManyRequestsError(
  error: unknown
): error is TooManyRequestsError {
  return error instanceof TooManyRequestsError;
}

// ─── ERROR RESPONSE BUILDERS ───

/**
 * Convert any error to a safe API response
 *
 * Domain errors are returned as-is.
 * Other errors are wrapped as internal server errors.
 *
 * Usage:
 * ```typescript
 * try {
 *   // code
 * } catch (error) {
 *   return errorResponse(error);
 * }
 * ```
 */
export function errorResponse(error: unknown) {
  if (isDomainError(error)) {
    return {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        status: error.status,
      },
    };
  }

  if (error instanceof Error) {
    console.error('Unexpected error:', error.message, error.stack);
  }

  return {
    ok: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
      status: 500,
    },
  };
}

/**
 * Throw error with context
 *
 * Usage:
 * ```typescript
 * throwError(
 *   'VALIDATION_ERROR',
 *   'Email is invalid',
 *   { email: ['Invalid email format'] }
 * );
 * ```
 */
export function throwError(
  code: ErrorCode,
  message: string,
  details?: Record<string, string[]>
): never {
  switch (code) {
    case 'VALIDATION_ERROR':
      throw new ValidationError(message, details);
    case 'UNAUTHORIZED':
      throw new UnauthorizedError(message);
    case 'FORBIDDEN':
      throw new ForbiddenError(message);
    case 'NOT_FOUND':
      throw new NotFoundError(message);
    case 'CONFLICT':
      throw new ConflictError(message);
    case 'TOO_MANY_REQUESTS':
      throw new TooManyRequestsError(message);
    case 'INSUFFICIENT_CREDITS':
      throw new InsufficientCreditsError(0, 0); // Override with custom message
    case 'ENTITLEMENT_LIMIT_REACHED':
      throw new EntitlementError(message);
    case 'PAYMENT_REQUIRED':
      throw new PaymentRequiredError(message);
    case 'OUT_OF_STOCK':
      throw new OutOfStockError(message);
    case 'INVALID_OPERATION':
      throw new InvalidOperationError(message);
    case 'UNPROCESSABLE_ENTITY':
      throw new UnprocessableEntityError(message);
    case 'SERVICE_UNAVAILABLE':
      throw new ServiceUnavailableError('Service', message);
    case 'INTERNAL_SERVER_ERROR':
      throw new InternalServerError(message);
    default:
      throw new Error(message);
  }
}
