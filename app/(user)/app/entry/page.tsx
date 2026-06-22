import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveAccessProfile, resolveDefaultLandingForProfile } from "@/lib/access-control";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

function isRedirectError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

export default async function AppEntryPage() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      redirect("/login");
    }

    const profile = await resolveAccessProfile(session.user.id, session.user.email ?? null);
    if (!profile) {
      logger.warn("AppEntry: profile resolution failed", { userId: session.user.id });
      redirect("/login");
    }

    const landingPath = resolveDefaultLandingForProfile(profile);
    redirect(landingPath);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    logger.error("AppEntry: unhandled error", { error: error instanceof Error ? error.message : String(error) });
    redirect("/login");
  }
}
