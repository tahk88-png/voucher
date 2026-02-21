export function isPlatformAdmin(email: string | null | undefined): boolean {
  if (!email) return false;

  const configuredAdminEmails = (process.env.PLATFORM_ADMIN_EMAILS ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  const adminEmails = new Set(configuredAdminEmails);

  if (process.env.NODE_ENV !== 'production') {
    const testPlatformAdminEmail =
      process.env.TEST_PLATFORM_ADMIN_EMAIL ?? 'platform-admin@gifthub.local';
    adminEmails.add(testPlatformAdminEmail);
  }

  return adminEmails.has(email);
}
