import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import InviteMemberForm from './invite-member-form';

export default async function MembersPage({ params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const merchant = await prisma.merchant.findUnique({
    where: { slug: params.slug },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!merchant) {
    notFound();
  }

  await requireMerchantRole(session.user.id, merchant.id, 'merchant_admin');

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Team Members</h1>

        <div className="space-y-6">
          <InviteMemberForm merchantSlug={params.slug} />

          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>Manage team members and their roles</CardDescription>
            </CardHeader>
            <CardContent>
              {merchant.members.length === 0 ? (
                <p className="text-[#6B5744] text-center py-8">No members yet</p>
              ) : (
                <div className="space-y-4">
                  {merchant.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex justify-between items-center p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{member.user.name || member.user.email}</p>
                        <p className="text-sm text-[#6B5744]">{member.user.email}</p>
                      </div>
                      <span className="text-sm px-2 py-1 bg-[#FAF7F2] rounded">{member.role}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
