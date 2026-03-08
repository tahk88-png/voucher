import { logger } from './logger';
import { recordCircuitTransition } from './metrics';

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerOptions {
  name: string;
  failureThreshold?: number;   // failures before opening (default: 5)
  resetTimeoutMs?: number;     // cooldown before half-open probe (default: 30s)
  successThreshold?: number;   // successes in half-open to close (default: 1)
}

interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number;
  lastError?: string;
}

const circuits = new Map<string, CircuitBreakerState>();

function getState(name: string): CircuitBreakerState {
  if (!circuits.has(name)) {
    circuits.set(name, {
      state: 'closed',
      failures: 0,
      successes: 0,
      lastFailureTime: 0,
    });
  }
  return circuits.get(name)!;
}

export class CircuitBreakerError extends Error {
  constructor(serviceName: string) {
    super(`Circuit breaker open for ${serviceName} — service temporarily unavailable`);
    this.name = 'CircuitBreakerError';
  }
}

export async function withCircuitBreaker<T>(
  opts: CircuitBreakerOptions,
  fn: () => Promise<T>,
): Promise<T> {
  const {
    name,
    failureThreshold = 5,
    resetTimeoutMs = 30_000,
    successThreshold = 1,
  } = opts;

  const circuit = getState(name);

  // Check if circuit is open
  if (circuit.state === 'open') {
    const elapsed = Date.now() - circuit.lastFailureTime;
    if (elapsed < resetTimeoutMs) {
      throw new CircuitBreakerError(name);
    }
    // Cooldown elapsed — move to half-open for a probe
    recordCircuitTransition(name, 'open', 'half-open');
    circuit.state = 'half-open';
    circuit.successes = 0;
    logger.info(`Circuit breaker half-open for ${name}, allowing probe request`);
  }

  try {
    const result = await fn();

    // Success — update state
    if (circuit.state === 'half-open') {
      circuit.successes++;
      if (circuit.successes >= successThreshold) {
        recordCircuitTransition(name, 'half-open', 'closed');
        circuit.state = 'closed';
        circuit.failures = 0;
        circuit.successes = 0;
        circuit.lastError = undefined;
        logger.info(`Circuit breaker closed for ${name} — service recovered`);
      }
    } else if (circuit.state === 'closed') {
      // Reset failure count on success
      circuit.failures = 0;
    }

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    circuit.failures++;
    circuit.lastFailureTime = Date.now();
    circuit.lastError = errorMsg;

    if (circuit.state === 'half-open') {
      // Probe failed — reopen
      recordCircuitTransition(name, 'half-open', 'open');
      circuit.state = 'open';
      logger.warn(`Circuit breaker re-opened for ${name} — probe failed`, { error: errorMsg });
    } else if (circuit.failures >= failureThreshold) {
      recordCircuitTransition(name, 'closed', 'open');
      circuit.state = 'open';
      logger.error(`Circuit breaker opened for ${name} after ${circuit.failures} failures`, {
        error: errorMsg,
        threshold: failureThreshold,
      });
    }

    throw error;
  }
}

/** Get current circuit breaker status for monitoring */
export function getCircuitStatus(name: string): CircuitBreakerState & { name: string } {
  return { name, ...getState(name) };
}

/** Get all circuit breaker statuses */
export function getAllCircuitStatuses(): Array<CircuitBreakerState & { name: string }> {
  const statuses: Array<CircuitBreakerState & { name: string }> = [];
  for (const [name, state] of circuits) {
    statuses.push({ name, ...state });
  }
  return statuses;
}

/** Reset a circuit (for testing or manual recovery) */
export function resetCircuit(name: string): void {
  circuits.delete(name);
}
