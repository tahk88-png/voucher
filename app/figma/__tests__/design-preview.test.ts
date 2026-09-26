import * as React from 'react';
import { describe, it, expect, vi, afterEach, afterAll } from 'vitest';

// Vitest compiles JSX with the classic runtime (tsconfig has jsx: preserve,
// which is Next's job), so the layout's JSX needs React in scope.
vi.stubGlobal('React', React);
afterAll(() => {
  vi.unstubAllGlobals();
});

// The layout's providers pull in the whole Figma prototype; the gate is all
// that is under test here.
vi.mock('../providers', () => ({
  FigmaProviders: ({ children }: { children: unknown }) => children,
}));
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

import FigmaLayout, { dynamic } from '../layout';
import { isDesignPreviewEnabled } from '../design-preview';

describe('isDesignPreviewEnabled', () => {
  it('is on outside production', () => {
    expect(isDesignPreviewEnabled({ NODE_ENV: 'development' })).toBe(true);
    expect(isDesignPreviewEnabled({ NODE_ENV: 'test' })).toBe(true);
  });

  it('is off in production by default', () => {
    expect(isDesignPreviewEnabled({ NODE_ENV: 'production' })).toBe(false);
  });

  it('needs exactly "true" to opt in on production', () => {
    expect(isDesignPreviewEnabled({ NODE_ENV: 'production', ENABLE_DESIGN_PREVIEW: 'true' })).toBe(true);
    expect(isDesignPreviewEnabled({ NODE_ENV: 'production', ENABLE_DESIGN_PREVIEW: '1' })).toBe(false);
    expect(isDesignPreviewEnabled({ NODE_ENV: 'production', ENABLE_DESIGN_PREVIEW: 'false' })).toBe(false);
  });
});

describe('/figma layout', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders per request so the runtime env decides, not the build', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('404s in production without the opt-in', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ENABLE_DESIGN_PREVIEW', '');
    expect(() => FigmaLayout({ children: null })).toThrow('NEXT_NOT_FOUND');
  });

  it('renders in production with ENABLE_DESIGN_PREVIEW=true', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ENABLE_DESIGN_PREVIEW', 'true');
    expect(() => FigmaLayout({ children: null })).not.toThrow();
  });

  it('renders in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('ENABLE_DESIGN_PREVIEW', '');
    expect(() => FigmaLayout({ children: null })).not.toThrow();
  });
});
