import { requireAdminPermission } from '@/lib/admin/guards';
import ModerationClient from './moderation-client';

export default async function ModerationPage() {
  await requireAdminPermission('admin.moderation.read');
  return <ModerationClient />;
}
