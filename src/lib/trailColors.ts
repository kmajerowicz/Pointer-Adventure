/**
 * Canonical trail color hex values.
 * These MUST match the CSS tokens in src/index.css (@theme --color-trail-*).
 * Mapbox GL JS requires hex strings in JS, so we export them here
 * as the single source of truth for both map layers and detail maps.
 */
export const TRAIL_COLOR_MAP: Record<string, string> = {
  red: '#E53E3E',
  blue: '#3B82F6',
  yellow: '#EAB308',
  green: '#22C55E',
  black: '#1A1A1A',
}

export const ACCENT_GOLD = '#C9A84C'
export const DARK_CASING = '#1a1a1a'
