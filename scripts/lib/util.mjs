// Shared palette, text helpers and SVG building blocks.

export const C = {
  bg: '#07090e',
  panel: '#0d121b',
  panel2: '#121927',
  line: '#1d2738',
  line2: '#2a3a52',
  text: '#e8eef6',
  dim: '#7a879a',
  faint: '#3a4658',
  red: '#ff4655',
  cyan: '#29e7ff',
  amber: '#ffb020',
  green: '#3dff9a',
  purple: '#a371f7',
};

export const FONT = "'Segoe UI', 'Helvetica Neue', Ubuntu, Roboto, Arial, sans-serif";
export const MONO = "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace";

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const r1 = (n) => Math.round(n * 10) / 10;
export const r2 = (n) => Math.round(n * 100) / 100;
export const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-US'));

export function svgDoc(w, h, body, title) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ` +
    `role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${body}</svg>`
  );
}

// ---- color math -----------------------------------------------------------

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
}

export const rgbToHex = (rgb) =>
  '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

export const shade = (hex, k) => rgbToHex(hexToRgb(hex).map((v) => v * k));

export function mix(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(A.map((v, i) => v + (B[i] - v) * t));
}

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ---- reusable HUD pieces ----------------------------------------------------

/** Card background with tactical corner brackets and a slow scanline sweep. */
export function hudFrame(w, h, { accent = C.cyan, id = 'f' } = {}) {
  const b = 18;
  const corner = (x, y, sx, sy) =>
    `<path d="M${x} ${y + sy * b}V${y}H${x + sx * b}" fill="none" stroke="${accent}" stroke-width="2"/>`;
  return `
  <defs>
    <linearGradient id="${id}-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.panel}"/><stop offset="1" stop-color="${C.bg}"/>
    </linearGradient>
    <pattern id="${id}-grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M24 0H0V24" fill="none" stroke="${C.line}" stroke-width="0.6" opacity="0.55"/>
    </pattern>
    <linearGradient id="${id}-scan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${accent}" stop-opacity="0"/>
      <stop offset="0.5" stop-color="${accent}" stop-opacity="0.07"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="${id}-clip"><rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="14"/></clipPath>
  </defs>
  <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="14" fill="url(#${id}-bg)" stroke="${C.line2}"/>
  <g clip-path="url(#${id}-clip)">
    <rect width="${w}" height="${h}" fill="url(#${id}-grid)"/>
    <rect x="0" y="-120" width="${w}" height="120" fill="url(#${id}-scan)">
      <animate attributeName="y" values="-120;${h}" dur="5s" repeatCount="indefinite"/>
    </rect>
  </g>
  ${corner(10, 10, 1, 1)}${corner(w - 10, 10, -1, 1)}${corner(10, h - 10, 1, -1)}${corner(w - 10, h - 10, -1, -1)}`;
}

/** Small section label like "// OPERATOR PROFILE". */
export function hudLabel(x, y, text, color = C.cyan, size = 12) {
  return `<text x="${x}" y="${y}" font-family="${MONO}" font-size="${size}" font-weight="700" letter-spacing="2" fill="${color}">${esc(text)}</text>`;
}

/** A crosshair reticle centered on 0,0. */
export function reticle(color = C.red, r = 16) {
  return `<g fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round">
    <circle r="${r}" opacity="0.9"/>
    <circle r="${r * 0.18}" fill="${color}" stroke="none"/>
    <path d="M0 ${-r - 7}V${-r * 0.45}M0 ${r + 7}V${r * 0.45}M${-r - 7} 0H${-r * 0.45}M${r + 7} 0H${r * 0.45}"/>
  </g>`;
}
