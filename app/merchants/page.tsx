import { permanentRedirect } from "next/navigation"

// The merchant directory lives at /hub (the header's "Merchants" link); this
// is the address people guess.
export default function MerchantsRedirect() {
  permanentRedirect("/hub")
}
