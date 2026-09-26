import { getContactEmail } from '@/lib/app-url';
import ContactClient from './contact-client';

// The support address is configuration (CONTACT_EMAIL, else support@<app host>),
// so it is read from the server's env on every request. A prerendered page
// would bake in whatever was set at build time, when no domain exists.
export const dynamic = 'force-dynamic';

export default function ContactPage() {
  return <ContactClient contactEmail={getContactEmail()} />;
}
