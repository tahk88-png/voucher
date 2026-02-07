import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import Link from 'next/link';
import { Settings } from 'lucide-react';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#2D2721]">Settings</h1>
        <p className="text-sm text-[#6B5744]">Manage your account preferences.</p>
      </div>

      <WarmCard padding="lg" className="bg-white border border-[#E7DCC7]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-[14px] bg-[#FFF9ED] flex items-center justify-center">
            <Settings className="h-6 w-6 text-[#8B7355]" />
          </div>
          <div className="space-y-2">
            <div className="text-lg font-semibold text-[#2D2721]">{user?.name || 'User'}</div>
            <div className="text-sm text-[#6B5744]">{user?.email}</div>
            <div className="text-xs text-[#8B7355]">
              Joined {user?.createdAt ? user.createdAt.toLocaleDateString() : 'recently'}
            </div>
          </div>
        </div>
      </WarmCard>

      <WarmCard padding="lg" className="bg-white border border-[#E7DCC7]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-[#2D2721]">Account access</div>
            <div className="text-sm text-[#6B5744]">Secure your account and manage access.</div>
          </div>
          <WarmButton asChild variant="outline" size="sm">
            <Link href="/api/auth/signout?callbackUrl=/">Sign out</Link>
          </WarmButton>
        </div>
      </WarmCard>
    </div>
  );
}
