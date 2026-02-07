export function isPlatformAdmin(email: string | null | undefined): boolean {
  if (!email) return false;

  const adminEmails = (process.env.PLATFORM_ADMIN_EMAILS ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (adminEmails.includes(email)) return true;

  if (process.env.NODE_ENV === 'production') return false;

  const testEmail = process.env.TEST_USER_EMAIL ?? 'test@example.com';
  const testAdminEmail = process.env.TEST_ADMIN_EMAIL ?? 'admin@coffee-house.com';
  return email === testEmail || email === testAdminEmail;
}
