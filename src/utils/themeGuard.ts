/*
  Runtime contrast guard to ensure minimum readability in light/dark modes.
  It nudges CSS variable colors slightly if contrast is too low.
*/

function clamp(n: number, min = 0, max = 1) { return Math.min(max, Math.max(min, n)); }

function parseColor(input: string): { r: number; g: number; b: number } | null {
  if (!input) return null;
  const s = input.trim();
  // hex #rrggbb
  const hex = s.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  if (hex) {
    return {
      r: parseInt(hex[1], 16),
      g: parseInt(hex[2], 16),
      b: parseInt(hex[3], 16),
    };
  }
  // rgb or rgba
  const rgb = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgb) {
    return { r: parseInt(rgb[1], 10), g: parseInt(rgb[2], 10), b: parseInt(rgb[3], 10) };
  }
  return null;
}

function toRgbString({ r, g, b }: { r: number; g: number; b: number }) {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

function relativeLuminance(c: { r: number; g: number; b: number }): number {
  const srgb = [c.r, c.g, c.b].map(v => v / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastRatio(fg: { r: number; g: number; b: number }, bg: { r: number; g: number; b: number }): number {
  const L1 = relativeLuminance(fg);
  const L2 = relativeLuminance(bg);
  const light = Math.max(L1, L2);
  const dark = Math.min(L1, L2);
  return (light + 0.05) / (dark + 0.05);
}

function blendTowards(color: { r: number; g: number; b: number }, towards: 'white' | 'black', factor: number) {
  const t = towards === 'white' ? 255 : 0;
  return {
    r: color.r + (t - color.r) * factor,
    g: color.g + (t - color.g) * factor,
    b: color.b + (t - color.b) * factor,
  };
}

function adjustForContrast(fg: { r: number; g: number; b: number }, bg: { r: number; g: number; b: number }, minRatio = 4.5) {
  let ratio = contrastRatio(fg, bg);
  if (ratio >= minRatio) return fg;
  const bgLum = relativeLuminance(bg);
  // If background is dark, push text towards white; else towards black
  const towards = bgLum < 0.5 ? 'white' as const : 'black' as const;
  let adjusted = { ...fg };
  // Try up to 12 small steps (max ~60% blend)
  for (let i = 1; i <= 12; i++) {
    adjusted = blendTowards(adjusted, towards, 0.05);
    ratio = contrastRatio(adjusted, bg);
    if (ratio >= minRatio) break;
  }
  return adjusted;
}

function getVarColor(styles: CSSStyleDeclaration, variable: string) {
  const v = styles.getPropertyValue(variable) || styles.getPropertyValue(variable.replace(/^--/, ''));
  return parseColor(v);
}

function setVarColor(root: HTMLElement, variable: string, color: { r: number; g: number; b: number }) {
  root.style.setProperty(variable, toRgbString(color));
}

export function applyContrastGuard() {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const styles = getComputedStyle(root);

  const bg = getVarColor(styles, '--bg');
  const surface = getVarColor(styles, '--surface');
  const surface2 = getVarColor(styles, '--surface-2');
  const text = getVarColor(styles, '--text');
  const textMuted = getVarColor(styles, '--text-muted');
  const border = getVarColor(styles, '--border');

  // Ensure base text contrast on bg and surface
  if (bg && text) {
    const adj = adjustForContrast(text, bg, 7); // aim higher for body text
    setVarColor(root, '--text', adj);
  }
  if (surface && text) {
    const adj = adjustForContrast(text, surface, 4.5);
    setVarColor(root, '--text', adj);
  }
  if (surface && textMuted) {
    const adj = adjustForContrast(textMuted, surface, 3.5);
    setVarColor(root, '--text-muted', adj);
  }
  if (bg && border) {
    // Make sure border stands out against background a bit
    const adj = adjustForContrast(border, bg, 1.6);
    setVarColor(root, '--border', adj);
  }

  // Ensure primary & status colors are readable on surface backgrounds
  const surfaceBase = surface || bg;
  const toGuard = ['--primary', '--primary-600', '--success', '--warning', '--danger', '--info', '--secondary'];
  toGuard.forEach(v => {
    const c = getVarColor(styles, v);
    if (c && surfaceBase) {
      const adj = adjustForContrast(c, surfaceBase, 3.5);
      setVarColor(root, v, adj);
    }
  });
}

// Optional helper to attach guard on resize for responsiveness
let resizeBound = false;
export function ensureContrastGuardsBound() {
  if (resizeBound || typeof window === 'undefined') return;
  resizeBound = true;
  window.addEventListener('resize', () => {
    try { applyContrastGuard(); } catch {}
  });
}
