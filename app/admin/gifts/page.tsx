import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AccessControlError, requirePlatformAdminProfile } from '@/lib/access-control';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import Link from 'next/link';
import {
  Gift, Tag, Calendar, Users, LayoutGrid, Megaphone,
  BarChart3, ArrowLeft, Package, TrendingUp,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Gift Management - Admin',
  robots: { index: false, follow: false },
};

export default async function AdminGiftsPage() {
  try {
    await requirePlatformAdminProfile();
  } catch (error) {
    if (error instanceof AccessControlError && error.status === 401) {
      redirect('/login');
    }
    redirect('/app');
  }

  const [
    productCount,
    activeProducts,
    categoryCount,
    occasionCount,
    personaCount,
    moduleCount,
    sponsorCount,
    interactionCount,
    topProducts,
  ] = await Promise.all([
    prisma.giftProduct.count(),
    prisma.giftProduct.count({ where: { isActive: true } }),
    prisma.giftCategory.count(),
    prisma.giftOccasion.count(),
    prisma.giftPersona.count(),
    prisma.giftFeedModule.count({ where: { isActive: true } }),
    prisma.sponsoredGiftPlacement.count({
      where: { isActive: true, startAt: { lte: new Date() }, endAt: { gte: new Date() } },
    }),
    prisma.userGiftInteraction.count(),
    prisma.giftProduct.findMany({
      where: { isActive: true },
      orderBy: { engagementScore: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        priceCents: true,
        engagementScore: true,
        viewCount: true,
        purchaseCount: true,
        conversionRate: true,
        merchant: { select: { name: true } },
      },
    }),
  ]);

  const stats = [
    { label: 'Total Products', value: productCount, accent: 'border-b-[#FFC857]' },
    { label: 'Active Products', value: activeProducts, accent: 'border-b-[#22C55E]' },
    { label: 'Categories', value: categoryCount, accent: 'border-b-[#9DB5A5]' },
    { label: 'Occasions', value: occasionCount, accent: 'border-b-[#E17B5C]' },
    { label: 'Personas', value: personaCount, accent: 'border-b-[#3B82F6]' },
    { label: 'Active Modules', value: moduleCount, accent: 'border-b-[#8B5CF6]' },
    { label: 'Sponsors', value: sponsorCount, accent: 'border-b-[#F59E0B]' },
    { label: 'Interactions', value: interactionCount, accent: 'border-b-[#EC4899]' },
  ];

  const sections = [
    { title: 'Categories', href: '/api/admin/gifts/categories', icon: Tag, color: 'bg-amber-100 text-amber-700', desc: 'Gift categories (Experiences, Food, etc.)' },
    { title: 'Occasions', href: '/api/admin/gifts/occasions', icon: Calendar, color: 'bg-red-100 text-red-700', desc: 'Birthday, Christmas, Valentine\'s, etc.' },
    { title: 'Personas', href: '/api/admin/gifts/personas', icon: Users, color: 'bg-blue-100 text-blue-700', desc: 'Gift recipient types' },
    { title: 'Feed Modules', href: '/api/admin/gifts/modules', icon: LayoutGrid, color: 'bg-purple-100 text-purple-700', desc: 'Curated feed sections' },
    { title: 'Sponsorships', href: '/api/admin/gifts/sponsors', icon: Megaphone, color: 'bg-green-100 text-green-700', desc: 'Sponsored placements' },
    { title: 'Analytics', href: '/api/admin/gifts/analytics', icon: BarChart3, color: 'bg-indigo-100 text-indigo-700', desc: 'Gift feed performance' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#E17B5C] flex items-center justify-center shadow-warm">
            <Gift className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-[#2D2721]">Gift Hub Management</h1>
            <p className="text-[#6B5744]">Manage gift products, feed modules, categories, and sponsorships</p>
          </div>
          <div className="flex gap-2">
            <WarmButton asChild variant="outline" size="sm">
              <Link href="/admin"><ArrowLeft className="h-4 w-4 mr-1" /> Admin</Link>
            </WarmButton>
            <WarmButton asChild variant="outline" size="sm">
              <Link href="/gifts"><Gift className="h-4 w-4 mr-1" /> View Gift Hub</Link>
            </WarmButton>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-8 mb-6">
          {stats.map((stat) => (
            <WarmCard key={stat.label} padding="md" className={`bg-white border-b-4 ${stat.accent}`}>
              <div className="text-xs font-semibold text-[#8B7355]">{stat.label}</div>
              <div className="text-2xl font-bold text-[#2D2721] mt-1">{stat.value}</div>
            </WarmCard>
          ))}
        </div>

        {/* Management sections */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <a key={section.title} href={section.href} target="_blank" rel="noopener noreferrer">
                <WarmCard hover padding="lg" className="bg-white h-full">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${section.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-[#2D2721]">{section.title}</h2>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">API</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#8B7355]">{section.desc}</p>
                </WarmCard>
              </a>
            );
          })}
        </div>

        {/* Top products table */}
        <WarmCard padding="lg" className="bg-white">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-[#E17B5C]" />
            <h2 className="text-lg font-semibold text-[#2D2721]">Top Performing Products</h2>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-sm text-[#8B7355]">No products yet. Add products via the merchant panel.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E0D4]">
                    <th className="text-left py-2 pr-4 text-[#8B7355] font-medium">Product</th>
                    <th className="text-left py-2 pr-4 text-[#8B7355] font-medium">Merchant</th>
                    <th className="text-right py-2 pr-4 text-[#8B7355] font-medium">Price</th>
                    <th className="text-right py-2 pr-4 text-[#8B7355] font-medium">Views</th>
                    <th className="text-right py-2 pr-4 text-[#8B7355] font-medium">Purchases</th>
                    <th className="text-right py-2 text-[#8B7355] font-medium">Conv. Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p) => (
                    <tr key={p.id} className="border-b border-[#E8E0D4]/50">
                      <td className="py-2 pr-4 font-medium text-[#2D2721]">{p.title}</td>
                      <td className="py-2 pr-4 text-[#6B5744]">{p.merchant.name}</td>
                      <td className="py-2 pr-4 text-right text-[#2D2721]">€{(p.priceCents / 100).toFixed(2)}</td>
                      <td className="py-2 pr-4 text-right text-[#6B5744]">{p.viewCount}</td>
                      <td className="py-2 pr-4 text-right text-[#6B5744]">{p.purchaseCount}</td>
                      <td className="py-2 text-right text-[#2D2721] font-medium">
                        {(p.conversionRate * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </WarmCard>
      </div>
    </div>
  );
}
