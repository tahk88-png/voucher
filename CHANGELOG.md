# Changelog

## [1.0.0] - 2024-01-XX

### Added
- Multi-tenant voucher platform with merchant isolation
- Voucher creation, publishing, and management
- Referral system with shareable links
- Credit system (locked/unlocked states)
- Weekly drop functionality with stock management
- PWA support with service worker and offline QR codes
- RBAC (platform_admin, merchant_admin, merchant_staff, user)
- Fraud prevention (rate limiting, self-referral prevention)
- Email magic link authentication
- Google and Apple OAuth support
- Merchant dashboard
- User wallet and credit management
- Checkout demo for credit application
- API documentation
- Unit tests for credit system
- Seed data script
- Docker compose setup for local development

### Technical
- Next.js 14 with App Router
- TypeScript strict mode
- Prisma ORM with PostgreSQL
- TailwindCSS + shadcn/ui components
- NextAuth for authentication
- Zod for validation
- Vitest for testing
- i18n structure (next-intl, ready for expansion)

## [1.1.0] - 2024-01-XX (Planned)

### Added
- Voucher publish endpoint
- Voucher update endpoint
- Better error handling with custom error classes
- Type definitions
- Session provider for client components
- Validation utilities

### Fixed
- Missing publish functionality
- TypeScript type safety improvements
