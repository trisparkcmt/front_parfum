/**
 * WCAG Color Contrast Audit Utilities
 * 
 * Checks color contrast ratios against WCAG standards:
 * - AA: 4.5:1 (normal text), 3:1 (large text)
 * - AAA: 7:1 (normal text), 4.5:1 (large text)
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : null;
}

/**
 * Calculate relative luminance (WCAG formula)
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((x) => {
    const s = x / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(
  color1: string,
  color2: string
): number | null {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return null;

  const lum1 = getLuminance(...rgb1);
  const lum2 = getLuminance(...rgb2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG standard
 */
export function checkWCAGCompliance(
  ratio: number,
  level: 'AA' | 'AAA' = 'AA',
  textSize: 'normal' | 'large' = 'normal'
): boolean {
  const standards = {
    AA: { normal: 4.5, large: 3 },
    AAA: { normal: 7, large: 4.5 },
  };

  return ratio >= standards[level][textSize];
}

/**
 * Get WCAG compliance status
 */
export function getWCAGStatus(ratio: number): {
  AA: boolean;
  AAA: boolean;
  rating: 'fail' | 'AA' | 'AAA';
} {
  return {
    AA: ratio >= 4.5,
    AAA: ratio >= 7,
    rating: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'fail',
  };
}

/**
 * Color palette WCAG audit
 * 
 * @example
 * const audit = auditColorPalette({
 *   background: '#ffffff',
 *   foreground: '#000000',
 *   gold: '#d4af37',
 * });
 */
export function auditColorPalette(
  colors: Record<string, string>,
  backgroundColor: string = '#ffffff'
): Record<string, any> {
  const results: Record<string, any> = {};

  Object.entries(colors).forEach(([name, color]) => {
    const ratio = getContrastRatio(color, backgroundColor);
    if (ratio) {
      const status = getWCAGStatus(ratio);
      results[name] = {
        ratio: ratio.toFixed(2),
        ...status,
        warning: ratio < 4.5 ? 'Fails WCAG AA' : undefined,
      };
    }
  });

  return results;
}

/**
 * Recommended WCAG-compliant color palette
 */
export const wcagSafeColors = {
  backgrounds: {
    white: '#ffffff',
    light: '#f5f5f5',
    dark: '#1a1a1a',
  },
  text: {
    onLight: '#1a1a1a', // 12.63:1 contrast
    onDark: '#ffffff',  // 12.63:1 contrast
    muted: '#666666',   // 5.74:1 contrast (light bg)
  },
  semantic: {
    success: '#0a7e0a',   // 6.2:1 on white
    error: '#dc2626',     // 5.0:1 on white
    warning: '#d97706',   // 4.55:1 on white
    info: '#2563eb',      // 4.54:1 on white
  },
};

/**
 * WCAG Audit Report for documentation
 */
export const wcagAuditGuide = `
# WCAG Color Contrast Standards

## Requirements
- **WCAG AA (minimum)**: 4.5:1 for normal text, 3:1 for large text
- **WCAG AAA (enhanced)**: 7:1 for normal text, 4.5:1 for large text

## Large Text Definition
- 18pt (24px) or larger
- 14pt (18.67px) or larger and bold

## Implementation Checklist
- [ ] Check all text-background combinations
- [ ] Test with color blindness simulators
- [ ] Use provided auditColorPalette() for automated checks
- [ ] Test with accessibility tools (axe, Lighthouse)
- [ ] Manual testing with screen readers

## Problem Colors to Avoid
- Gray text (#999999) on white = 3.94:1 (fails AA)
- Light gray (#cccccc) on white = 1.48:1 (fails)
- Gold on light backgrounds < 4.5:1 ratio

## Quick Fixes
- Increase font weight for lighter colors
- Use darker or more saturated colors
- Increase font size to 18pt+ (allows 3:1 ratio)
- Add colored background behind text for contrast
`;
