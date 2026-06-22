import { requireAdminPermission } from '@/lib/admin/guards';
import FlagsClient from './flags-client';

export default async function FeatureFlagsPage() {
  await requireAdminPermission('admin.flags.read');
  return <FlagsClient />;
}
