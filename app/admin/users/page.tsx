import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { WarmCard } from '@/components/warm-card';
import { AccessControlError, requirePlatformAdminProfile } from '@/lib/access-control';
import AdminUsersClient from './admin-users-client';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: { q?: string; page?: string }
}) {
  try {
    await requirePlatformAdminProfile();
  } catch (error) {
    if (error instanceof AccessControlError && error.status === 401) {
      redirect('/login');
    }
    redirect('/app');
  }

  const search = searchParams?.q?.trim() || '';
  const page = Math.max(1, parseInt(searchParams?.page || '1', 10));
  const limit = 50;
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { name: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            voucherPurchases: true,
            redemptions: true,
            merchantMembers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  const serializedUsers = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#2D2721]">User Management</h1>
            <p className="text-[#6B5744]">{total} users total</p>
          </div>
        </div>

        <AdminUsersClient
          initialUsers={serializedUsers}
          total={total}
          page={page}
          pages={Math.ceil(total / limit)}
          search={search}
        />
      </div>
    </div>
  );
}
