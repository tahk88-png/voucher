import { isResendConfigured } from "@/lib/resend"
import { LoginPageClient } from "./login-form"

// Read mail configuration at request time, not at build time.
export const dynamic = "force-dynamic"

export default function LoginPage() {
  // Only a boolean crosses to the client — never the key itself.
  return <LoginPageClient emailSignInEnabled={isResendConfigured()} />
}
