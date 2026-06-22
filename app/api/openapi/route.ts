import { NextResponse } from 'next/server';
import { openApiSpec } from '@/lib/openapi/spec';

// The OpenAPI 3.0.3 document lives in `lib/openapi/spec.ts` so the
// schema is testable, reusable, and doesn't bloat the route handler.
// This endpoint just serves it with a cache-friendly CORS header.

export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://gifthub.app',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
