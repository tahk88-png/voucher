import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Heart, Bell, BellOff, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      voucher: {
        select: {
          id: true,
          type: true,
          value: true,
          currency: true,
          status: true,
          validFrom: true,
          validTo: true,
          merchant: { select: { id: true, name: true, slug: true, brandLogoUrl: true } },
        },
      },
      campaign: {
        select: { id: true, name: true, status: true },
      },
      merchant: {
        select: { id: true, name: true, slug: true, brandLogoUrl: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  function getItemTitle(item: (typeof items)[0]) {
    if (item.voucher) {
      const v = item.voucher;
      return v.type === 'percentage'
        ? `${v.value / 100}% off`
        : `${(v.value / 100).toFixed(2)} ${v.currency}`;
    }
    if (item.campaign) return item.campaign.name;
    if (item.merchant) return item.merchant.name;
    return 'Unknown item';
  }

  function getItemLink(item: (typeof items)[0]) {
    if (item.voucher) return `/app/voucher/${item.voucher.id}`;
    if (item.merchant) return `/merchant/${item.merchant.slug}`;
    return '#';
  }

  function getItemSubtitle(item: (typeof items)[0]) {
    if (item.voucher?.merchant) return item.voucher.merchant.name;
    if (item.merchant) return 'Merchant';
    if (item.campaign) return 'Campaign';
    return '';
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Heart size={28} style={{ color: 'var(--primary)' }} />
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          My Wishlist
        </h1>
        <span
          className="text-sm px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'var(--muted)', color: 'var(--text-secondary)' }}
        >
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Heart
            size={48}
            className="mx-auto mb-4"
            style={{ color: 'var(--muted)' }}
          />
          <p className="text-lg font-medium" style={{ color: 'var(--text)' }}>
            Your wishlist is empty
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Save vouchers, merchants, and campaigns you like.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl p-5 flex flex-col justify-between"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text)' }}>
                      {getItemTitle(item)}
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {getItemSubtitle(item)}
                    </p>
                  </div>
                  <Heart
                    size={18}
                    style={{ color: 'var(--destructive)', fill: 'var(--destructive)' }}
                  />
                </div>

                {item.voucher && (
                  <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                    Valid until{' '}
                    {new Date(item.voucher.validTo).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div
                  className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg"
                  style={{
                    backgroundColor: item.priceAlert ? 'var(--primary)' : 'var(--background)',
                    color: item.priceAlert ? 'var(--primary-foreground)' : 'var(--text-secondary)',
                    border: item.priceAlert ? 'none' : '1px solid var(--border)',
                  }}
                >
                  {item.priceAlert ? <Bell size={12} /> : <BellOff size={12} />}
                  {item.priceAlert ? 'Alert on' : 'No alert'}
                </div>

                <Link
                  href={getItemLink(item)}
                  className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                  style={{ color: 'var(--primary)' }}
                >
                  View <ExternalLink size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
