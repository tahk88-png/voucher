import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveAccessProfile, resolveDefaultLandingForProfile } from "@/lib/access-control";

export default async function AppEntryPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await resolveAccessProfile(session.user.id, session.user.email ?? null);
  if (!profile) {
    redirect("/login");
  }

  redirect(resolveDefaultLandingForProfile(profile));
}

