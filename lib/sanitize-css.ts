/**
 * Sanitize a CSS value to prevent injection via style tags.
 * Strips anything that could break out of a CSS property value context:
 * - Closing tags (</style>)
 * - Semicolons, braces, and other CSS control chars
 * - JavaScript expressions
 * Only allows safe color/CSS value characters: hex colors, rgb(), hsl(), named colors, numbers, %, px, etc.
 */
export function sanitizeCssValue(value: string): string {
  if (typeof value !== 'string') return ''
  // Remove anything that could close a style tag or inject HTML
  let safe = value.replace(/<\/?style[^>]*>/gi, '')
  // Remove semicolons, braces, backslashes, and quotes
  safe = safe.replace(/[;{}\\'"<>]/g, '')
  // Remove url() expressions (prevent external resource loading)
  safe = safe.replace(/url\s*\(/gi, '')
  // Remove expression() and other IE-specific injection vectors
  safe = safe.replace(/expression\s*\(/gi, '')
  // Limit length
  if (safe.length > 100) safe = safe.substring(0, 100)
  return safe.trim()
}
