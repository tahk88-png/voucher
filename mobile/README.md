# Vouchr Mobile (iOS + Android)

A cross-platform native app for the Vouchr platform, built with **Expo (React Native + TypeScript)**. One codebase ships to both the App Store and Google Play, and it talks to the existing Next.js backend over REST.

It mirrors the web's warm design system, so the apps feel like one product.

---

## Architecture

| Concern | Choice |
|---|---|
| Framework | Expo SDK 52, React Native 0.76 (new architecture) |
| Routing | `expo-router` (file-based, like Next.js) — see `app/` |
| Language | TypeScript (strict) |
| Auth | **Bearer JWT** — `POST /api/auth/mobile/login` issues a token, stored in `expo-secure-store`; every request sends `Authorization: Bearer <token>` |
| API client | `src/lib/api.ts` (typed fetch wrapper, base URL from env/app.json) |
| Theme | `src/theme.ts` — mirrors the web `globals.css` warm tokens |
| QR redemption | `react-native-qrcode-svg` |

### Why Expo (not native Kotlin + Swift)?
One codebase → both platforms, and **EAS Cloud Build** compiles iOS without a Mac. Native dual-codebases would double the work for the same result.

---

## Backend dependency (already added to the Next.js app)

The app needs a small **mobile REST surface** (bearer-authed, distinct from the web's NextAuth cookie sessions). These were added alongside this scaffold:

- `POST /api/auth/mobile/login` — `{ email, password }` → `{ token, user }`
- `GET  /api/mobile/me` — current user
- `GET  /api/mobile/wallet` — spendable credit balance per currency
- `GET  /api/mobile/vouchers` — the user's purchased vouchers

Token signing/verification lives in `lib/mobile-auth.ts` (signed with `AUTH_SECRET`). To expose more data to the app, add `/api/mobile/*` routes that call `verifyMobileToken(req)` at the top — that's the pattern.

---

## Setup

```bash
cd mobile
npm install

# Point the app at your backend (defaults to app.json extra.apiBaseUrl):
echo "EXPO_PUBLIC_API_URL=https://your-deployment.example.com" > .env

npm run typecheck   # tsc --noEmit
npm start           # Expo dev server (scan the QR with Expo Go)
```

> The app expects to reach the backend over HTTPS. For local dev against `http://localhost:3000`, run the backend and use your machine's LAN IP (e.g. `EXPO_PUBLIC_API_URL=http://192.168.x.x:3000`), since the device can't reach `localhost`.

---

## Build for the stores (EAS — no local Xcode/Android SDK needed)

```bash
npm install -g eas-cli
eas login
eas build:configure

# Cloud builds:
eas build --platform android      # → .aab for Google Play
eas build --platform ios          # → .ipa for the App Store (Apple account required)

# Submit:
eas submit --platform android
eas submit --platform ios
```

EAS compiles in the cloud, so **you don't need a Mac for iOS** or a local Android SDK.

---

## What's included

- ✅ Auth (login, secure token storage, session restore, auth-gated navigation)
- ✅ Tabs: **Wallet** (credit balance), **Vouchers** (list → detail), **Referrals**, **Profile**
- ✅ Voucher detail → **QR redemption** screen
- ✅ Pull-to-refresh, empty/error states, themed components (`src/components/ui.tsx`)

## Next steps (to reach full parity)

1. **Branded assets** — add `assets/icon.png`, `assets/splash.png`, `assets/adaptive-icon.png` and re-reference them in `app.json` (removed here so the scaffold builds without binaries).
2. **Push notifications** — `expo-notifications` + register the device token against the platform's web-push/notification system.
3. **More screens** — purchase flow (Stripe via `@stripe/stripe-react-native`), gift cards, tickets, notifications inbox, cashback detail.
4. **OTP / OAuth login** — add a mobile OTP endpoint and social sign-in to match the web's auth options.
5. **Roll the bearer pattern** to any additional `/api/mobile/*` data the app needs.

> This is a buildable, coherent scaffold — compile it via EAS and extend. It was authored without a local mobile toolchain (Windows host), so run `npm run typecheck` and an EAS/dev build to validate before release.
