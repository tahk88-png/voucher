import { requireAdminPermission } from '@/lib/admin/guards';
import SupportClient from './support-client';

export default async function SupportPage() {
  await requireAdminPermission('admin.support.read');
  return <SupportClient />;
}
