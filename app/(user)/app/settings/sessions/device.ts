export interface DeviceDescription {
  browser: string | null;
  os: string | null;
  mobile: boolean;
}

/** Best-effort browser/OS from a User-Agent header. Unknown parts are null. */
export function describeDevice(ua: string | null | undefined): DeviceDescription {
  if (!ua) return { browser: null, os: null, mobile: false };

  let browser: string | null = null;
  // Order matters: Edge and Opera also contain "Chrome/", Chrome contains "Safari/".
  if (ua.includes('Firefox/') || ua.includes('FxiOS/')) browser = 'Firefox';
  else if (ua.includes('Edg/') || ua.includes('EdgA/') || ua.includes('EdgiOS/')) browser = 'Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
  else if (ua.includes('SamsungBrowser/')) browser = 'Samsung Internet';
  else if (ua.includes('Chrome/') || ua.includes('CriOS/')) browser = 'Chrome';
  else if (ua.includes('Safari/')) browser = 'Safari';

  let os: string | null = null;
  if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X') || ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('CrOS')) os = 'ChromeOS';
  else if (ua.includes('Linux')) os = 'Linux';

  const mobile = /Mobi|iPhone|iPad|iPod|Android/i.test(ua);
  return { browser, os, mobile };
}
