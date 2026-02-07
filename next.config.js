const createNextIntlPlugin = require('next-intl/plugin');
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const withNextIntl = createNextIntlPlugin('./i18n.ts');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';

const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' ${isDev ? "'unsafe-eval'" : ''} 'unsafe-inline'`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://api.stripe.com https://*.resend.com",
  "frame-src 'self' https://js.stripe.com https://checkout.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].filter(Boolean);

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'X-Permitted-Cross-Domain-Policies',
    value: 'none',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
  {
    key: 'Cross-Origin-Resource-Policy',
    value: 'same-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  {
    key: 'Content-Security-Policy',
    value: cspDirectives.join('; '),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-router-dom': path.resolve(__dirname, 'lib/router-shim.tsx'),
      'react-router': path.resolve(__dirname, 'lib/router-shim.tsx'),
      '@': path.resolve(__dirname),
      '@app': path.resolve(__dirname, 'figma/app'),
      '@services': path.resolve(__dirname, 'figma/services'),
    };
    return config;
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Locale-prefixed routes -> Figma UI
        {
          source: '/:locale(en|et|es|fr|de|fi|sv|no|da|lv|lt|pl|uk|it|ru)',
          destination: '/figma/home',
        },
        {
          source: '/:locale(en|et|es|fr|de|fi|sv|no|da|lv|lt|pl|uk|it|ru)/:path*',
          destination: '/figma/:path*',
        },
        // Merchant tenant routes -> Figma dashboard UI
        { source: '/merchant/:slug', destination: '/figma/dashboard' },
        { source: '/merchant/:slug/dashboard', destination: '/figma/dashboard' },
        { source: '/merchant/:slug/campaigns', destination: '/figma/campaigns-list' },
        { source: '/merchant/:slug/campaigns/new', destination: '/figma/campaigns/create' },
        { source: '/merchant/:slug/campaigns/:id', destination: '/figma/campaigns/:id/admin' },
        { source: '/merchant/:slug/vouchers', destination: '/figma/vouchers' },
        { source: '/merchant/:slug/vouchers/new', destination: '/figma/vouchers/create' },
        { source: '/merchant/:slug/events', destination: '/figma/events' },
        { source: '/merchant/:slug/events/new', destination: '/figma/events/create' },
        { source: '/merchant/:slug/events/:id', destination: '/figma/events/:id' },
        { source: '/merchant/:slug/gift-cards', destination: '/figma/gift-cards' },
        { source: '/merchant/:slug/gift-cards/new', destination: '/figma/gift-cards/create' },
        { source: '/merchant/:slug/referrals', destination: '/figma/referrals' },
        { source: '/merchant/:slug/redemptions', destination: '/figma/redeem' },
        // User app routes -> Figma UI
        { source: '/app/:path*', destination: '/figma/:path*' },
        // Admin routes -> Figma UI
        { source: '/admin/:path*', destination: '/figma/admin-dashboard' },
        // Root -> Figma landing
        { source: '/', destination: '/figma/home' },
        // Catch-all (exclude API, Next internals, figma, and static files)
        {
          source: '/:path((?!api|_next|figma|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|.*\\..*).*)',
          destination: '/figma/:path',
        },
      ],
    };
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = withNextIntl(withPWA(nextConfig));
