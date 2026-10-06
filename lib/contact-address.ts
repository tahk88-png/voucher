/**
 * Whether an e-mail address is a documentation/dev placeholder rather than a
 * mailbox someone reads: example.com/.org/.net (RFC 2606, incl. subdomains),
 * localhost, and the reserved .example/.invalid/.localhost/.test/.local TLDs.
 *
 * A fresh deployment derives its support address from NEXT_PUBLIC_APP_URL
 * (lib/app-url getContactEmail), which gives e.g. support@localhost in dev.
 * Such an address must never be shown to visitors as a real contact.
 */
const PLACEHOLDER_DOMAINS = ["example.com", "example.org", "example.net", "localhost"];
const PLACEHOLDER_TLDS = ["example", "invalid", "localhost", "test", "local"];

export function isPlaceholderEmail(address: string | null | undefined): boolean {
  if (!address) return true;
  const at = address.lastIndexOf("@");
  if (at < 1) return true;
  const host = address.slice(at + 1).trim().toLowerCase().replace(/\.$/, "");
  if (!host) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[")) return true; // bare IP
  if (PLACEHOLDER_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`))) return true;
  const tld = host.split(".").pop() ?? "";
  return PLACEHOLDER_TLDS.includes(tld);
}

/** The address if it is a real mailbox, otherwise null. */
export function publicContactEmail(address: string | null | undefined): string | null {
  return address && !isPlaceholderEmail(address) ? address.trim() : null;
}
