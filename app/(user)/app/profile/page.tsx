import { redirect } from 'next/navigation';

// Profile and settings were two pages showing the same account data; the
// editable profile now lives on the settings page.
export default function ProfilePage() {
  redirect('/app/settings');
}
