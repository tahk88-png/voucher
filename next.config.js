// EISDIR patch is loaded via NODE_OPTIONS=--require ./fix-eisdir.js
const createNextIntlPlugin = require('next-intl/plugin');
const path = require('path');


const withNextIntl = createNextIntlPlugin('./i18n.ts');

const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' ${isDev ? "'unsafe-eval'" : ''} 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  [
    "connect-src 'self'",
    "https://api.stripe.com",
    "https://*.resend.com",
    "https://*.sentry.io",
    "https://*.supabase.co",
    "wss://*.pusher.com",
    "https://*.pusher.com",
    isDev ? "ws://localhost:*" : "",
  ].filter(Boolean).join(' '),
  "frame-src 'self' https://js.stripe.com https://checkout.stripe.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  isProd ? "upgrade-insecure-requests" : "",
].filter(Boolean);

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  isProd ? { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' } : null,
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
  { key: 'Content-Security-Policy', value: cspDirectives.join('; ') },
].filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: 'graph.facebook.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.cloudinary.com' },
      { protocol: 'https', hostname: '*.cloudfront.net' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-router-dom': path.resolve(__dirname, 'lib/router-shim.tsx'),
      'react-router': path.resolve(__dirname, 'lib/router-shim.tsx'),
      '@': path.resolve(__dirname),
      '@app': path.resolve(__dirname, 'figma', 'app'),
      '@services': path.resolve(__dirname, 'figma', 'services'),
    };
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/manifest.json',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
