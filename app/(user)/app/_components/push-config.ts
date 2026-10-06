/**
 * Web push only works with a real VAPID key pair. The shipped .env.example uses
 * the placeholder "change_me"; lib/web-push.ts ignores keys of 20 characters or
 * fewer. A key that fails this check must not be offered to users.
 */
export function isVapidKeyConfigured(key: string | null | undefined): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  if (trimmed.length <= 20) return false;
  if (/change[_-]?me/i.test(trimmed)) return false;
  return true;
}

/** Server-side: both halves of the key pair are needed to actually send pushes. */
export function isWebPushConfigured(): boolean {
  return (
    isVapidKeyConfigured(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) &&
    isVapidKeyConfigured(process.env.VAPID_PRIVATE_KEY)
  );
}
