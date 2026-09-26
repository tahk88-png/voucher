/**
 * /figma renders the Figma Make prototype on mock data behind a mock auth
 * context. It is a design reference, not part of the product, so production
 * serves it only when ENABLE_DESIGN_PREVIEW=true is set explicitly.
 * Development and test always have it.
 */
export function isDesignPreviewEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NODE_ENV !== 'production') return true;
  return env.ENABLE_DESIGN_PREVIEW === 'true';
}
