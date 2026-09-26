import { auth } from '@/lib/auth';
import WelcomeClient from './welcome-client';

// The session is read here on the server: there is no next-auth
// SessionProvider in the tree, so useSession() in the client would throw.
export default async function WelcomePage() {
  const session = await auth();
  return <WelcomeClient userName={session?.user?.name ?? null} />;
}
