import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { WarmButton } from '@/components/warm-button';
import { getTranslations } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/app')}`);
  }

  // Get translations - use default locale for app routes
  let t;
  let messages;
  try {
    t = await getTranslations('nav');
    messages = await getMessages();
  } catch (err) {
    // Fallback if i18n fails
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('[AppLayout] getTranslations failed:', err);
    }
    t = (key: string) => {
      const fallbacks: Record<string, string> = {
        portal: 'Portal',
        tickets: 'Tickets',
        logout: 'Logout',
        user: 'User',
      };
      return fallbacks[key] || key;
    };
    messages = {};
  }

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-10 border-b border-[#E7DCC7] bg-[#FFFBF5]/90 backdrop-blur">
          <div className="container mx-auto flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <Link
                href="/app"
                className="font-semibold text-[#2D2721] hover:text-[#6B5744]"
              >
                {t('portal')}
              </Link>
              <nav className="hidden sm:flex gap-4 text-sm text-[#6B5744]">
                <Link href="/app/tickets" className="hover:text-[#2D2721]">
                  {t('tickets')}
                </Link>
                <Link href="/app/payments" className="hover:text-[#2D2721]">
                  {t('payments')}
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#6B5744] truncate max-w-[180px]">
                {session.user.email ?? session.user.name ?? t('user')}
              </span>
              <WarmButton variant="ghost" size="sm" asChild>
                <Link href="/api/auth/signout?callbackUrl=/">{t('logout')}</Link>
              </WarmButton>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </NextIntlClientProvider>
  );
}
