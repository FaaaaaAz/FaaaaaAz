// Player card: rotating 3D rank gem, level/XP bar and stats in shooter terms.

import { C, FONT, MONO, esc, fmt, svgDoc, hudFrame, hudLabel, shade, mix } from '../lib/util.mjs';
import { gem, renderMesh } from '../lib/mesh3d.mjs';

const W = 1000;
const H = 310;

const shortDate = (iso) =>
  iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : '';

export function operatorCard(data, prog) {
  const accent = prog.color;
  const ex = 150;
  const ey = 128;

  const hex = (r) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      return `${(ex + Math.cos(a) * r).toFixed(1)},${(ey + Math.sin(a) * r).toFixed(1)}`;
    }).join(' ');

  const emblem = `
  <defs>
    <radialGradient id="op-glow"><stop offset="0" stop-color="${accent}" stop-opacity="0.45"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
  </defs>
  <circle cx="${ex}" cy="${ey}" r="105" fill="url(#op-glow)">
    <animate attributeName="r" values="95;110;95" dur="3s" repeatCount="indefinite"/>
  </circle>
  <polygon points="${hex(92)}" fill="${C.bg}" fill-opacity="0.6" stroke="${accent}" stroke-opacity="0.35" stroke-width="1.5"/>
  <polygon points="${hex(80)}" fill="none" stroke="${accent}" stroke-width="2" stroke-dasharray="14 10">
    <animateTransform attributeName="transform" type="rotate" values="0 ${ex} ${ey};360 ${ex} ${ey}" dur="24s" repeatCount="indefinite"/>
  </polygon>
  <ellipse cx="${ex}" cy="${ey + 70}" rx="46" ry="7" fill="${accent}" opacity="0.18"/>
  ${renderMesh(gem(8), {
    cx: ex, cy: ey - 4, size: 52, color: accent, dur: 8, tilt: 0.42, wobble: 0.1,
    stroke: mix(accent, '#ffffff', 0.55), strokeWidth: 0.8, ambient: 0.28, specular: 0.5,
  })}
  <text x="${ex}" y="${ey + 112}" text-anchor="middle" font-family="${FONT}" font-size="26" font-weight="800" letter-spacing="3" fill="${accent}">${esc(prog.rank)}</text>
  <text x="${ex}" y="${ey + 134}" text-anchor="middle" font-family="${MONO}" font-size="11" letter-spacing="1.5" fill="${C.dim}">${
    prog.nextTier ? `${fmt(prog.toNextTier)} XP TO ${prog.nextTier}` : 'MAX TIER'
  }</text>`;

  const x0 = 310;
  const barW = 660;

  const stats = [
    ['KILLSTREAK', `${data.current}d`, 'current streak'],
    ['BEST STREAK', `${data.longest.len}d`, 'longest streak'],
    ['ACCURACY', `${Math.round(data.accuracy * 100)}%`, 'active days · 1y'],
    ['HEADSHOT', fmt(data.best?.count ?? 0), `best day · ${shortDate(data.best?.date)}`],
    ['ROUNDS FIRED', fmt(data.commits), 'commits'],
    ['OBJECTIVES', fmt(data.prs), 'pull requests'],
    ['TOUR OF DUTY', `${fmt(Math.floor((Date.parse(data.today) - Date.parse(data.createdAt)) / 864e5))}d`, 'since joining GitHub'],
    ['MAPS', fmt(data.repos), 'repositories'],
  ];
  const cellW = 162;
  const cells = stats
    .map(([game, value, real], i) => {
      const cx = x0 + (i % 4) * (cellW + 4);
      const cy = 168 + Math.floor(i / 4) * 66;
      const delay = (0.2 + i * 0.08).toFixed(2);
      return `<g opacity="0">
        <animate attributeName="opacity" from="0" to="1" begin="${delay}s" dur="0.4s" fill="freeze"/>
        <rect x="${cx}" y="${cy}" width="${cellW}" height="58" rx="6" fill="${C.panel2}" stroke="${C.line}"/>
        <rect x="${cx}" y="${cy + 10}" width="3" height="38" fill="${i < 4 ? accent : C.cyan}"/>
        <text x="${cx + 14}" y="${cy + 18}" font-family="${MONO}" font-size="10" font-weight="700" letter-spacing="1.5" fill="${i < 4 ? accent : C.cyan}">${esc(game)}</text>
        <text x="${cx + 14}" y="${cy + 41}" font-family="${FONT}" font-size="21" font-weight="800" fill="${C.text}">${esc(value)}</text>
        <text x="${cx + 14}" y="${cy + 52}" font-family="${MONO}" font-size="9" fill="${C.dim}">${esc(real)}</text>
      </g>`;
    })
    .join('');

  const body = `
  ${hudFrame(W, H, { accent, id: 'op' })}
  ${emblem}
  <line x1="290" y1="30" x2="290" y2="${H - 30}" stroke="${C.line2}" stroke-dasharray="3 5"/>
  ${hudLabel(x0, 44, '// OPERATOR PROFILE', C.cyan, 11)}
  <text x="${x0}" y="84" font-family="${FONT}" font-size="34" font-weight="800" letter-spacing="1" fill="${C.text}">${esc(data.name.toUpperCase())}</text>
  <text x="${x0}" y="106" font-family="${MONO}" font-size="12" fill="${C.dim}">@${esc(data.user)} · CLASS: FULL-STACK / AI / UX · BASE: LA PAZ, BO</text>

  <g transform="translate(${W - 128} 34)">
    <rect width="98" height="54" rx="6" fill="${shade(accent, 0.18)}" stroke="${accent}"/>
    <text x="49" y="18" text-anchor="middle" font-family="${MONO}" font-size="10" font-weight="700" letter-spacing="2" fill="${accent}">LEVEL</text>
    <text x="49" y="45" text-anchor="middle" font-family="${FONT}" font-size="26" font-weight="800" fill="${C.text}">${prog.level}</text>
  </g>

  <text x="${x0}" y="132" font-family="${MONO}" font-size="11" fill="${C.dim}">XP <tspan fill="${C.text}" font-weight="700">${fmt(prog.xp)}</tspan> / ${fmt(prog.levelNext)} · NEXT: LVL ${prog.level + 1}</text>
  <text x="${x0 + barW}" y="132" text-anchor="end" font-family="${MONO}" font-size="11" fill="${C.dim}">${fmt(data.yearTotal)} XP THIS YEAR</text>
  <rect x="${x0}" y="140" width="${barW}" height="10" rx="5" fill="${C.panel2}" stroke="${C.line}"/>
  <rect x="${x0}" y="140" width="0" height="10" rx="5" fill="${accent}">
    <animate attributeName="width" from="0" to="${((barW) * prog.levelProgress).toFixed(1)}" dur="1.4s" begin="0.2s" fill="freeze" calcMode="spline" keySplines="0.2 0.8 0.2 1" keyTimes="0;1"/>
  </rect>
  ${Array.from({ length: 19 }, (_, i) => `<rect x="${x0 + ((barW) / 20) * (i + 1)}" y="140" width="2" height="10" fill="${C.bg}" opacity="0.7"/>`).join('')}
  ${cells}`;

  return svgDoc(W, H, body, `${data.name} — operator card: ${prog.rank}, level ${prog.level}`);
}
