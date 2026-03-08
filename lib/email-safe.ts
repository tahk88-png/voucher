import { loggers } from './logger';
import { withCircuitBreaker, CircuitBreakerError } from './circuit-breaker';

/**
 * Safe email sending wrapper that never throws
 * Use this to wrap all email operations to prevent email failures from breaking critical flows
 *
 * Usage:
 * ```typescript
 * await sendEmailSafely(
 *   'voucher_purchase_receipt',
 *   async () => await sendVoucherPurchaseReceipt({ ... }),
 *   { userId, voucherId }
 * );
 * ```
 */
export async function sendEmailSafely<T>(
  emailType: string,
  sendFn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const startTime = Date.now();

  try {
    await withCircuitBreaker(
      { name: 'email', failureThreshold: 5, resetTimeoutMs: 60_000 },
      sendFn,
    );
    const duration = Date.now() - startTime;

    loggers.email(emailType, context?.recipient as string || 'unknown', true);

    return { success: true };
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error instanceof CircuitBreakerError) {
      loggers.email(emailType, context?.recipient as string || 'unknown', false, 'circuit_breaker_open');
      return { success: false, error: 'Email service temporarily unavailable' };
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    loggers.email(emailType, context?.recipient as string || 'unknown', false, errorMessage);

    // Log additional context for debugging
    if (context) {
      loggers.external('email_service', emailType, false, duration, errorMessage);
    }

    // Return error instead of throwing - email failures should not break main flow
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send multiple emails in parallel with error handling
 * Returns array of results
 */
export async function sendEmailsBatch(
  emails: Array<{
    type: string;
    sendFn: () => Promise<void>;
    context?: Record<string, unknown>;
  }>
): Promise<Array<{ success: boolean; type: string; error?: string }>> {
  const promises = emails.map(async ({ type, sendFn, context }) => {
    const result = await sendEmailSafely(type, sendFn, context);
    return {
      ...result,
      type,
    };
  });

  return Promise.all(promises);
}

/**
 * Retry email sending with exponential backoff
 */
export async function sendEmailWithRetry<T>(
  emailType: string,
  sendFn: () => Promise<T>,
  context?: Record<string, unknown>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<{ success: boolean; error?: string; attempts: number }> {
  let lastError: string = '';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendEmailSafely(emailType, sendFn, context);

    if (result.success) {
      if (attempt > 1) {
        loggers.email(emailType, context?.recipient as string || 'unknown', true);
      }
      return { success: true, attempts: attempt };
    }

    lastError = result.error || 'Unknown error';

    // Don't retry on last attempt
    if (attempt < maxRetries) {
      const delay = initialDelayMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: maxRetries,
  };
}
