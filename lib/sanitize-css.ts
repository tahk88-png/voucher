// Full list of CSS named colors (Level 4)
const CSS_NAMED_COLORS = new Set([
  'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure',
  'beige', 'bisque', 'black', 'blanchedalmond', 'blue',
  'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse',
  'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson',
  'cyan', 'darkblue', 'darkcyan', 'darkgoldenrod', 'darkgray',
  'darkgreen', 'darkgrey', 'darkkhaki', 'darkmagenta', 'darkolivegreen',
  'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen',
  'darkslateblue', 'darkslategray', 'darkslategrey', 'darkturquoise',
  'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey',
  'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen', 'fuchsia',
  'gainsboro', 'ghostwhite', 'gold', 'goldenrod', 'gray', 'green',
  'greenyellow', 'grey', 'honeydew', 'hotpink', 'indianred', 'indigo',
  'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen',
  'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan',
  'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey',
  'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue',
  'lightslategray', 'lightslategrey', 'lightsteelblue', 'lightyellow',
  'lime', 'limegreen', 'linen', 'magenta', 'maroon', 'mediumaquamarine',
  'mediumblue', 'mediumorchid', 'mediumpurple', 'mediumseagreen',
  'mediumslateblue', 'mediumspringgreen', 'mediumturquoise',
  'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose',
  'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab',
  'orange', 'orangered', 'orchid', 'palegoldenrod', 'palegreen',
  'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff', 'peru',
  'pink', 'plum', 'powderblue', 'purple', 'rebeccapurple', 'red',
  'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown',
  'seagreen', 'seashell', 'sienna', 'silver', 'skyblue', 'slateblue',
  'slategray', 'slategrey', 'snow', 'springgreen', 'steelblue', 'tan',
  'teal', 'thistle', 'tomato', 'transparent', 'turquoise', 'violet',
  'wheat', 'white', 'whitesmoke', 'yellow', 'yellowgreen',
  'currentcolor', 'inherit',
])

// Hex: #fff, #ffffff, #ffffffff (3, 6, or 8 hex digits)
const HEX_COLOR_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

// rgb()/rgba() with integer or percentage values
const RGB_RE = /^rgba?\(\s*(\d{1,3}%?\s*,\s*){2}\d{1,3}%?\s*(,\s*(0|1|0?\.\d+))?\s*\)$/
// Also support modern space-separated syntax: rgb(255 0 0 / 0.5)
const RGB_MODERN_RE = /^rgba?\(\s*\d{1,3}%?(\s+\d{1,3}%?){2}\s*(\/\s*(0|1|0?\.\d+|\d{1,3}%))?\s*\)$/

// hsl()/hsla() with degree and percentage values
const HSL_RE = /^hsla?\(\s*\d{1,3}(deg)?\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*(,\s*(0|1|0?\.\d+))?\s*\)$/
// Modern space-separated syntax: hsl(120 100% 50% / 0.5)
const HSL_MODERN_RE = /^hsla?\(\s*\d{1,3}(deg)?\s+\d{1,3}%\s+\d{1,3}%\s*(\/\s*(0|1|0?\.\d+|\d{1,3}%))?\s*\)$/

/**
 * Sanitize a CSS color value using an allowlist approach.
 * Only permits:
 * - Valid hex colors: #fff, #ffffff, #ffffffff
 * - Valid rgb()/rgba() functions
 * - Valid hsl()/hsla() functions
 * - CSS named colors (e.g. "red", "transparent", "currentcolor")
 *
 * Returns an empty string for anything that does not match.
 */
export function sanitizeCssValue(value: string): string {
  if (typeof value !== 'string') return ''

  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed.length > 100) return ''

  // Check hex color
  if (HEX_COLOR_RE.test(trimmed)) return trimmed

  // Check named color
  if (CSS_NAMED_COLORS.has(trimmed.toLowerCase())) return trimmed

  // Check rgb/rgba
  if (RGB_RE.test(trimmed) || RGB_MODERN_RE.test(trimmed)) return trimmed

  // Check hsl/hsla
  if (HSL_RE.test(trimmed) || HSL_MODERN_RE.test(trimmed)) return trimmed

  // Reject everything else
  return ''
}
