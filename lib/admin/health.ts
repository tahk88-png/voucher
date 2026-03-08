import { prisma } from "@/lib/prisma";
import { getRedisClient } from "@/lib/redis";
import { logger } from "@/lib/logger";

type CheckResult = {
  status: string;
  latencyMs: number;
  error?: string;
};

type SystemHealth = {
  status: string;
  checks: Record<string, CheckResult>;
};

const CHECK_TIMEOUT_MS = 5000;

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Health check timed out")), timeoutMs)
    ),
  ]);
}

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    await withTimeout(
      prisma.$queryRaw`SELECT 1`,
      CHECK_TIMEOUT_MS
    );
    return { status: "healthy", latencyMs: Date.now() - start };
  } catch (err: any) {
    return {
      status: "unhealthy",
      latencyMs: Date.now() - start,
      error: err.message,
    };
  }
}

async function checkRedis(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const client = await getRedisClient();
    if (!client) {
      return {
        status: "unavailable",
        latencyMs: Date.now() - start,
        error: "Redis client not configured",
      };
    }
    await withTimeout(client.ping(), CHECK_TIMEOUT_MS);
    return { status: "healthy", latencyMs: Date.now() - start };
  } catch (err: any) {
    return {
      status: "unhealthy",
      latencyMs: Date.now() - start,
      error: err.message,
    };
  }
}

async function checkStripe(): Promise<CheckResult> {
  const start = Date.now();
  const configured = !!process.env.STRIPE_SECRET_KEY;
  return {
    status: configured ? "healthy" : "unavailable",
    latencyMs: Date.now() - start,
    error: configured ? undefined : "STRIPE_SECRET_KEY not configured",
  };
}

async function checkEmail(): Promise<CheckResult> {
  const start = Date.now();
  const configured = !!process.env.RESEND_API_KEY;
  return {
    status: configured ? "healthy" : "unavailable",
    latencyMs: Date.now() - start,
    error: configured ? undefined : "RESEND_API_KEY not configured",
  };
}

async function checkDns(): Promise<CheckResult> {
  const domain = process.env.PLATFORM_ROOT_DOMAIN;
  if (!domain) {
    return { status: "unavailable", latencyMs: 0, error: "PLATFORM_ROOT_DOMAIN not set" };
  }
  const start = Date.now();
  try {
    const { checkSpf } = await import("@/lib/dns-health");
    const cleanDomain = domain.split(":")[0];
    const spf = await withTimeout(checkSpf(cleanDomain), CHECK_TIMEOUT_MS);
    return {
      status: spf.status === "pass" ? "healthy" : "degraded",
      latencyMs: Date.now() - start,
      error: spf.status !== "pass" ? spf.error : undefined,
    };
  } catch (err: any) {
    return {
      status: "degraded",
      latencyMs: Date.now() - start,
      error: err.message,
    };
  }
}

/**
 * Run all system health checks in parallel and aggregate results.
 */
export async function getSystemHealth(): Promise<SystemHealth> {
  const [database, redis, stripe, email, dns] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkStripe(),
    checkEmail(),
    checkDns(),
  ]);

  const checks: Record<string, CheckResult> = {
    database,
    redis,
    stripe,
    email,
    dns,
  };

  // Database is critical - if it fails, system is unhealthy
  let overallStatus: string;
  if (database.status === "unhealthy") {
    overallStatus = "unhealthy";
  } else if (
    Object.values(checks).some(
      (c) => c.status === "unhealthy" || c.status === "unavailable"
    )
  ) {
    overallStatus = "degraded";
  } else {
    overallStatus = "healthy";
  }

  logger.info("System health check completed", {
    status: overallStatus,
    checks: Object.fromEntries(
      Object.entries(checks).map(([k, v]) => [k, v.status])
    ),
  });

  return { status: overallStatus, checks };
}
