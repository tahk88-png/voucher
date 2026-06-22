import { requireAdminPermission } from '@/lib/admin/guards';
import EmailDashboardClient from './email-dashboard-client';

export default async function EmailPage() {
  await requireAdminPermission('admin.email.read');
  return <EmailDashboardClient />;
}
