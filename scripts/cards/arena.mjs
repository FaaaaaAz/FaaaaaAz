// 3D contribution battlefield: the last year as an axonometric city of blocks.
// A reticle hunts the top days, fires tracers, drops hitmarkers and fills a
// kill feed. Everything is SMIL/CSS so it animates inside a GitHub <img>.

import { C, FONT, MONO, esc, fmt, r1, svgDoc, hudFrame, hudLabel, reticle, shade, mix } from '../lib/util.mjs';

const W = 1000;
const H = 440;
const U = [11.9, 3.5]; // screen vector of one week step
const V = [-8.6, 6.6]; // screen vector of one weekday step
const O = [100, 150]; // origin of week 0 / Sunday
const LEVELS = ['#121a28', '#0b4d61', '#0e83a0', '#18bfdc', '#29e7ff'];
const TARGETS = 5;
const STEP = 2.6; // seconds per target in the reticle loop
const MUZZLE = [500, H + 20];

const pt = (w, d, h = 0) => [O[0] + w * U[0] + d * V[0], O[1] + w * U[1] + d * V[1] - h];
const poly = (pts) => pts.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ');
const longDate = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/** keyTimes/values for an opacity pulse starting at fraction a. */
function pulse(a, len, peak = 1) {
  const t = (x) => Math.min(1, Math.max(0, x)).toFixed(4);
  return { keyTimes: `0;${t(a)};${t(a + 0.004)};${t(a + len)};1`, values: `0;0;${peak};0;0` };
}

export function arenaCard(data) {
  const days = data.calendar;
  const offset = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
  const max = Math.max(1, ...days.map((d) => d.count));
  const cells = days.map((d, i) => {
    const k = i + offset;
    const w = Math.floor(k / 7);
    const dw = k % 7;
    const h = d.count === 0 ? 2 : 7 + 66 * Math.sqrt(d.count / max);
    return { ...d, w, d: dw, h };
  });

  // --- blocks (painter's order: back to front) ---
  const s = 0.84;
  const pad = (1 - s) / 2;
  const blocks = [...cells]
    .sort((a, b) => a.w + a.d - (b.w + b.d) || a.w - b.w)
    .map((c) => {
      const color = LEVELS[c.level] ?? LEVELS[4];
      const A = pt(c.w + pad, c.d + pad);
      const B = pt(c.w + pad + s, c.d + pad);
      const Cc = pt(c.w + pad + s, c.d + pad + s);
      const D = pt(c.w + pad, c.d + pad + s);
      const up = ([x, y]) => [x, y - c.h];
      const delay = Math.round((c.w + c.d) * 16);
      const top = [up(A), up(B), up(Cc), up(D)];
      const glow = c.level >= 3 ? ` filter="url(#ar-glow)"` : '';
      return `<g class="b" style="animation-delay:${delay}ms">` +
        `<polygon points="${poly([D, Cc, up(Cc), up(D)])}" fill="${shade(color, 0.62)}"/>` +
        `<polygon points="${poly([B, Cc, up(Cc), up(B)])}" fill="${shade(color, 0.42)}"/>` +
        `<polygon points="${poly(top)}" fill="${c.level ? mix(color, '#ffffff', 0.08) : color}"${glow}/>` +
        `</g>`;
    })
    .join('');

  // --- targets: the strongest days ---
  const targets = [...cells]
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count || b.date.localeCompare(a.date))
    .slice(0, TARGETS);
  const n = targets.length;
  const total = Math.max(1, n) * STEP;
  const center = (c) => {
    const [x, y] = pt(c.w + 0.5, c.d + 0.5, c.h);
    return [r1(x), r1(y)];
  };

  let hunt = '';
  let feed = '';
  if (n) {
    const pos = targets.map(center);
    const values = [pos[n - 1], ...pos.flatMap((p) => [p, p])].map((p) => p.join(',')).join(';');
    const keyTimes = ['0', ...targets.flatMap((_, i) => [((i * STEP + 0.55) / total).toFixed(4), (((i + 1) * STEP) / total).toFixed(4)])];
    keyTimes[keyTimes.length - 1] = '1';

    hunt = targets
      .map((c, i) => {
        const [x, y] = center(c);
        const hitAt = (i * STEP + 0.75) / total;
        const flash = pulse(hitAt, 0.03);
        const marker = pulse(hitAt, 0.09);
        const A = pt(c.w + pad, c.d + pad, c.h);
        const B = pt(c.w + pad + s, c.d + pad, c.h);
        const Cc = pt(c.w + pad + s, c.d + pad + s, c.h);
        const D = pt(c.w + pad, c.d + pad + s, c.h);
        const t = (v) => Math.min(1, v).toFixed(4);
        return `
        <polygon points="${poly([A, B, Cc, D])}" fill="${C.red}" opacity="0">
          <animate attributeName="opacity" dur="${total}s" repeatCount="indefinite" keyTimes="0;${t(hitAt)};${t(hitAt + 0.004)};1" values="0;0;0.95;0.95"/>
        </polygon>
        <line x1="${MUZZLE[0]}" y1="${MUZZLE[1]}" x2="${x}" y2="${y}" stroke="#fff3c4" stroke-width="2.2" stroke-linecap="round" opacity="0">
          <animate attributeName="opacity" dur="${total}s" repeatCount="indefinite" keyTimes="${flash.keyTimes}" values="${flash.values}"/>
        </line>
        <g transform="translate(${x} ${y})" opacity="0">
          <animate attributeName="opacity" dur="${total}s" repeatCount="indefinite" keyTimes="${marker.keyTimes}" values="${marker.values}"/>
          <path d="M-12 -12L-5 -5M12 -12L5 -5M-12 12L-5 5M12 12L5 5" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>
          <circle r="16" fill="none" stroke="${C.red}" stroke-width="2">
            <animate attributeName="r" dur="${total}s" repeatCount="indefinite" keyTimes="0;${t(hitAt)};${t(hitAt + 0.09)};1" values="4;4;26;26"/>
          </circle>
        </g>
        <text x="${x + 14}" y="${y - 14}" font-family="${FONT}" font-size="17" font-weight="800" fill="${C.amber}" stroke="${C.bg}" stroke-width="3" paint-order="stroke" opacity="0">
          +${c.count}
          <animate attributeName="opacity" dur="${total}s" repeatCount="indefinite" keyTimes="0;${t(hitAt)};${t(hitAt + 0.01)};${t(hitAt + 0.16)};1" values="0;0;1;0;0"/>
          <animateTransform attributeName="transform" type="translate" dur="${total}s" repeatCount="indefinite" keyTimes="0;${t(hitAt)};${t(hitAt + 0.16)};1" values="0 0;0 0;0 -26;0 -26"/>
        </text>`;
      })
      .join('');

    hunt += `<g>
      <animateMotion dur="${total}s" repeatCount="indefinite" values="${values}" keyTimes="${keyTimes.join(';')}" calcMode="spline"
        keySplines="${Array.from({ length: keyTimes.length - 1 }, () => '0.6 0 0.2 1').join(';')}"/>
      <g>
        <animateTransform attributeName="transform" type="scale" dur="${total / n}s" repeatCount="indefinite" keyTimes="0;0.2;0.3;1" values="1.6;1.6;1;1"/>
        ${reticle(C.red, 15)}
      </g>
    </g>`;

    feed = targets
      .map((c, i) => {
        const y = 128 + i * 42;
        const hitAt = (i * STEP + 0.75) / total;
        const t = (v) => Math.min(1, v).toFixed(4);
        return `<g opacity="0.25">
          <animate attributeName="opacity" dur="${total}s" repeatCount="indefinite" keyTimes="0;${t(hitAt)};${t(hitAt + 0.004)};1" values="0.25;0.25;1;1"/>
          <rect x="772" y="${y}" width="196" height="34" rx="5" fill="${C.panel2}" stroke="${C.line}"/>
          <rect x="772" y="${y}" width="3" height="34" fill="${C.red}"/>
          <text x="784" y="${y + 15}" font-family="${MONO}" font-size="11" font-weight="700" fill="${C.text}">⌖ ${esc(data.user)} <tspan fill="${C.red}">▸</tspan> ${fmt(c.count)} hits</text>
          <text x="784" y="${y + 28}" font-family="${MONO}" font-size="9.5" fill="${C.dim}">${esc(longDate(c.date))}</text>
        </g>`;
      })
      .join('');
  }

  // --- month labels along the front edge ---
  let lastMonth = -1;
  const months = cells
    .filter((c) => c.d === 0)
    .map((c) => {
      const m = new Date(`${c.date}T00:00:00Z`).getUTCMonth();
      if (m === lastMonth) return '';
      lastMonth = m;
      if (c.w > 51) return '';
      const [x, y] = pt(c.w + 0.2, 7.9);
      const name = new Date(`${c.date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
      return `<text x="${r1(x)}" y="${r1(y)}" font-family="${MONO}" font-size="10" fill="${C.dim}" transform="rotate(16 ${r1(x)} ${r1(y)})">${name}</text>`;
    })
    .join('');

  const legend = LEVELS.map(
    (c, i) => `<rect x="${92 + i * 18}" y="${H - 34}" width="13" height="13" rx="2" fill="${c}" stroke="${C.line2}" stroke-width="0.5"/>`,
  ).join('');

  const body = `
  ${hudFrame(W, H, { accent: C.red, id: 'ar' })}
  <defs>
    <filter id="ar-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <radialGradient id="ar-floor" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${C.cyan}" stop-opacity="0.12"/><stop offset="1" stop-color="${C.cyan}" stop-opacity="0"/></radialGradient>
  </defs>
  <style>
    .b{animation:rise .7s cubic-bezier(.2,.9,.3,1.2) both}
    @keyframes rise{from{transform:translateY(-36px);opacity:0}to{transform:translateY(0);opacity:1}}
  </style>

  ${hudLabel(30, 42, '// CONTRIBUTION ARENA', C.red, 12)}
  <text x="30" y="62" font-family="${MONO}" font-size="11" fill="${C.dim}">MAP: LAST 365 DAYS · EVERY BLOCK IS A DAY · HEIGHT = CONTRIBUTIONS</text>

  <ellipse cx="${pt(26, 3.5)[0]}" cy="${pt(26, 3.5)[1]}" rx="400" ry="130" fill="url(#ar-floor)"/>
  <polygon points="${poly([pt(-0.4, -0.4), pt(53.4, -0.4), pt(53.4, 7.4), pt(-0.4, 7.4)])}" fill="${C.bg}" fill-opacity="0.55" stroke="${C.line2}" stroke-dasharray="4 6"/>
  ${blocks}
  ${months}
  ${hunt}

  <line x1="752" y1="34" x2="752" y2="${H - 30}" stroke="${C.line2}" stroke-dasharray="3 5"/>
  ${hudLabel(772, 42, '// KILL FEED', C.red, 12)}
  <text x="772" y="62" font-family="${MONO}" font-size="10" fill="${C.dim}">TOP ${n} DAYS ELIMINATED</text>
  <text x="772" y="102" font-family="${FONT}" font-size="30" font-weight="800" fill="${C.text}">${fmt(data.yearTotal)}<tspan font-family="${MONO}" font-size="11" font-weight="400" fill="${C.dim}" dx="8">TOTAL DMG · 1Y</tspan></text>
  ${feed}
  <text x="772" y="${H - 52}" font-family="${MONO}" font-size="11" fill="${C.dim}">ACTIVE DAYS <tspan fill="${C.text}" font-weight="700">${data.activeDays}</tspan> / ${days.length}</text>
  <text x="772" y="${H - 34}" font-family="${MONO}" font-size="11" fill="${C.dim}">AMMO <tspan fill="${C.amber}" font-weight="700">∞</tspan> · STATUS <tspan fill="${C.green}" font-weight="700">ENGAGED</tspan></text>

  <text x="30" y="${H - 24}" font-family="${MONO}" font-size="10" fill="${C.dim}">LESS</text>
  ${legend}
  <text x="${92 + 5 * 18 + 4}" y="${H - 24}" font-family="${MONO}" font-size="10" fill="${C.dim}">MORE</text>
  <g transform="translate(${92 + 5 * 18 + 54} ${H - 28})"><polygon points="-7,-7 7,-7 7,7 -7,7" fill="${C.red}" transform="scale(0.9)"/></g>
  <text x="${92 + 5 * 18 + 68}" y="${H - 24}" font-family="${MONO}" font-size="10" fill="${C.dim}">ELIMINATED</text>`;

  return svgDoc(W, H, body, `Contribution arena: ${data.yearTotal} contributions in the last year`);
}
