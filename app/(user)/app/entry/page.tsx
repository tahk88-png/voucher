import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveAccessProfile, resolveDefaultLandingForProfile } from "@/lib/access-control";

export default async function AppEntryPage() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      redirect("/login");
    }

    const profile = await resolveAccessProfile(session.user.id, session.user.email ?? null);
    if (!profile) {
      console.warn(`[AppEntry] Profile resolution failed for user ${session.user.id}`);
      redirect("/login");
    }

    const landingPath = resolveDefaultLandingForProfile(profile);
    redirect(landingPath);
  } catch (error) {
    console.error("[AppEntry] Unhandled error:", error);
    redirect("/login");
  }
}

