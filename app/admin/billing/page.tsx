import { requireAdminPermission } from '@/lib/admin/guards';
import BillingClient from './billing-client';

export default async function BillingPage() {
  await requireAdminPermission('admin.billing.read');
  return <BillingClient />;
}
