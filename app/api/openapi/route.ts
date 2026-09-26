import { NextResponse } from 'next/server';
import { getOpenApiSpec } from '@/lib/openapi/spec';
import { getAppUrl } from '@/lib/app-url';

// The OpenAPI 3.0.3 document lives in `lib/openapi/spec.ts` so the
// schema is testable, reusable, and doesn't bloat the route handler.
// This endpoint just serves it with a cache-friendly CORS header.

// The server URL and CORS origin come from runtime config, so never
// prerender this at build time (no deployment URL exists then).
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getOpenApiSpec(), {
    headers: {
      'Access-Control-Allow-Origin': getAppUrl(),
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
