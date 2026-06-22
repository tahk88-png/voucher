import { requireAdminPermission } from '@/lib/admin/guards';
import OpsClient from './ops-client';

export default async function OpsPage() {
  await requireAdminPermission('admin.ops.read');
  return <OpsClient />;
}
