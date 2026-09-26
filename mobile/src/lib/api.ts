/**
 * Thin typed REST client for the Vouchr backend (the existing Next.js
 * app/api/* routes). Auth is bearer-token based: the auth context calls
 * setAuthToken() after login / session restore, and every request attaches
 * `Authorization: Bearer <token>` so the backend's verifyMobileToken path
 * can authenticate the mobile user.
 *
 * Base URL comes from EXPO_PUBLIC_API_URL (mobile/.env, or the EAS build
 * profile's env), which Expo inlines into the bundle at build time. There is
 * deliberately no production default: the backend's domain is deployment
 * config, and a guessed one would ship an app talking to someone else's server.
 */

// Dev-only fallback: reachable from the iOS simulator and web. A physical
// device needs EXPO_PUBLIC_API_URL set to the machine's LAN IP (see README).
const DEV_API_URL = 'http://localhost:3000';

function resolveBaseUrl(): string | null {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/+$/, '');
  if (__DEV__) {
    console.warn(`EXPO_PUBLIC_API_URL is not set; using ${DEV_API_URL}.`);
    return DEV_API_URL;
  }
  console.error('EXPO_PUBLIC_API_URL was not set when this build was made; API requests will fail.');
  return null;
}

const BASE_URL = resolveBaseUrl();

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  if (!BASE_URL) {
    throw new ApiError(0, 'App is not configured: EXPO_PUBLIC_API_URL was not set for this build.');
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Network error — check your connection.');
  }

  const text = await res.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'error' in data && typeof (data as any).error === 'string'
        ? (data as any).error
        : undefined) || `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }

  return data as T;
}

export const api = {
  baseUrl: BASE_URL,
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};
