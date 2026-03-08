import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/error-handler';
import { requireAdminPermission } from '@/lib/admin/guards';
import { checkEmailDnsRecords } from '@/lib/dns-health';

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.ops.dns');

    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain') || process.env.PLATFORM_ROOT_DOMAIN;

    if (!domain) {
      return NextResponse.json(
        { error: 'No domain specified and PLATFORM_ROOT_DOMAIN not set' },
        { status: 400 }
      );
    }

    // Strip port if present
    const cleanDomain = domain.split(':')[0];
    const results = await checkEmailDnsRecords(cleanDomain);

    return NextResponse.json(results);
  });
}
