// Hero banner: glitching name, typed roles, a projected 3D hologram and a
// perspective floor that scrolls toward the viewer.

import { C, FONT, MONO, esc, r1, svgDoc, hudFrame } from '../lib/util.mjs';
import { icosahedron, renderMesh } from '../lib/mesh3d.mjs';

const W = 1000;
const H = 300;
const HX = 835;
const HY = 138;

const ROLES = [
  'FULL-STACK DEVELOPER',
  'REACT & REACT NATIVE ENGINEER',
  'UX/UI + AI ENTHUSIAST',
  'BUILDING PRODUCTS PEOPLE ENJOY',
];

function floor() {
  const top = 222;
  const bottom = H;
  const vx = W / 2;
  const verticals = [];
  for (let xb = -700; xb <= W + 700; xb += 70) {
    verticals.push(`<line x1="${r1(vx + (xb - vx) * 0.08)}" y1="${top}" x2="${xb}" y2="${bottom}"/>`);
  }
  const N = 7;
  const yAt = (s) => r1(top + (bottom - top) * s ** 2.4);
  const horizontals = Array.from({ length: N }, (_, j) => {
    const ys = Array.from({ length: 13 }, (_, k) => yAt((j + k / 12) / N));
    return `<line x1="0" x2="${W}" y1="${ys[0]}" y2="${ys[0]}">
      <animate attributeName="y1" values="${ys.join(';')}" dur="2.4s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="${ys.join(';')}" dur="2.4s" repeatCount="indefinite"/>
    </line>`;
  });
  return `<g stroke="${C.red}" stroke-width="1" opacity="0.55">${verticals.join('')}${horizontals.join('')}</g>
  <rect x="0" y="${top - 1}" width="${W}" height="${bottom - top + 1}" fill="url(#hd-fade)"/>`;
}

function roles() {
  const n = ROLES.length;
  const dur = n * 3.2;
  return ROLES.map((role, i) => {
    const a = i / n;
    const b = (i + 1) / n;
    const t = (x) => x.toFixed(4);
    const typed = a + (b - a) * 0.38;
    const erase = a + (b - a) * 0.9;
    const width = role.length * 12.2 + 6;
    return `<clipPath id="hd-type${i}"><rect x="96" y="150" height="34" width="0">
        <animate attributeName="width" dur="${dur}s" repeatCount="indefinite" keyTimes="0;${t(a)};${t(typed)};${t(erase)};${t(b)};1" values="0;0;${r1(width)};${r1(width)};0;0"/>
      </rect></clipPath>
      <text x="98" y="174" clip-path="url(#hd-type${i})" font-family="${MONO}" font-size="20" font-weight="700" fill="${C.cyan}">${esc(role)}</text>`;
  }).join('');
}

export function headerCard(data, prog) {
  const name = data.name.toUpperCase();
  const nameText = (cls, fill, extra = '') =>
    `<text class="${cls}" x="48" y="128" font-family="${FONT}" font-size="62" font-weight="900" letter-spacing="2" fill="${fill}"${extra}>${esc(name)}</text>`;

  const bracket = (sx, sy) => {
    const s = 74;
    const l = 16;
    const x = HX + sx * s;
    const y = HY + sy * s;
    return `<path d="M${x} ${y - sy * l}V${y}H${x - sx * l}" fill="none"/>`;
  };

  const body = `
  ${hudFrame(W, H, { accent: C.red, id: 'hd' })}
  <defs>
    <linearGradient id="hd-fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.bg}" stop-opacity="1"/><stop offset="0.6" stop-color="${C.bg}" stop-opacity="0.25"/><stop offset="1" stop-color="${C.bg}" stop-opacity="0.6"/>
    </linearGradient>
    <linearGradient id="hd-beam" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="${C.cyan}" stop-opacity="0.4"/><stop offset="1" stop-color="${C.cyan}" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="hd-sliceA"><rect x="0" y="80" width="${W}" height="16"/><rect x="0" y="108" width="${W}" height="9"/></clipPath>
    <clipPath id="hd-sliceB"><rect x="0" y="94" width="${W}" height="12"/><rect x="0" y="118" width="${W}" height="14"/></clipPath>
  </defs>
  <style>
    .ga{animation:ga 3.7s infinite steps(1)}
    .gb{animation:gb 3.7s infinite steps(1)}
    @keyframes ga{0%,84%,100%{opacity:0;transform:translate(0,0)}85%{opacity:.85;transform:translate(-6px,0)}88%{opacity:.85;transform:translate(4px,0)}91%{opacity:.85;transform:translate(-2px,0)}93%{opacity:0}}
    @keyframes gb{0%,84%,100%{opacity:0;transform:translate(0,0)}86%{opacity:.85;transform:translate(6px,0)}89%{opacity:.85;transform:translate(-5px,0)}92%{opacity:.85;transform:translate(3px,0)}94%{opacity:0}}
    .blink{animation:blink 1s infinite steps(1)}
    @keyframes blink{50%{opacity:0}}
  </style>
  <g clip-path="url(#hd-clip)">${floor()}</g>

  <g font-family="${MONO}" font-size="11" font-weight="700" letter-spacing="1.5">
    <circle cx="52" cy="40" r="4" fill="${C.green}" class="blink"/>
    <text x="62" y="44" fill="${C.green}">ONLINE</text>
    <text x="130" y="44" fill="${C.dim}">OPERATOR <tspan fill="${C.text}">${esc(data.user)}</tspan>  ·  BASE <tspan fill="${C.text}">LA PAZ, BO</tspan>  ·  RANK <tspan fill="${prog.color}">${esc(prog.rank)}</tspan>  ·  LVL <tspan fill="${C.text}">${prog.level}</tspan></text>
  </g>

  ${nameText('ga', C.red, ' clip-path="url(#hd-sliceA)"')}
  ${nameText('gb', C.cyan, ' clip-path="url(#hd-sliceB)"')}
  ${nameText('', C.text)}
  <rect x="48" y="138" width="120" height="4" fill="${C.red}"/>
  <rect x="172" y="138" width="24" height="4" fill="${C.red}" opacity="0.5"/>

  <text x="48" y="174" font-family="${MONO}" font-size="20" font-weight="700" fill="${C.red}">&gt;<tspan class="blink">_</tspan></text>
  ${roles()}

  <!-- hologram -->
  <polygon points="${HX - 30},250 ${HX + 30},250 ${HX + 78},${HY - 40} ${HX - 78},${HY - 40}" fill="url(#hd-beam)" opacity="0.5">
    <animate attributeName="opacity" values="0.35;0.6;0.4;0.55;0.35" dur="2.2s" repeatCount="indefinite"/>
  </polygon>
  <ellipse cx="${HX}" cy="250" rx="46" ry="9" fill="none" stroke="${C.cyan}" stroke-width="2"/>
  <ellipse cx="${HX}" cy="250" rx="30" ry="5" fill="${C.cyan}" opacity="0.5"/>
  <ellipse cx="${HX}" cy="${HY}" rx="84" ry="22" fill="none" stroke="${C.cyan}" stroke-opacity="0.5" stroke-dasharray="4 8">
    <animateTransform attributeName="transform" type="rotate" values="-12 ${HX} ${HY};348 ${HX} ${HY}" dur="16s" repeatCount="indefinite"/>
  </ellipse>
  <g opacity="0.92">
    <animate attributeName="opacity" values="0.92;0.92;0.5;0.92;0.92;0.7;0.92" keyTimes="0;0.6;0.62;0.64;0.9;0.91;1" dur="5s" repeatCount="indefinite"/>
    ${renderMesh(icosahedron(), {
      cx: HX, cy: HY, size: 58, color: C.cyan, dur: 10, tilt: 0.35, wobble: 0.25,
      stroke: '#c8fbff', strokeWidth: 1, fillOpacity: 0.55, ambient: 0.25, specular: 0.5,
    })}
  </g>
  <g stroke="${C.red}" stroke-width="2.5" stroke-linecap="square">
    <animate attributeName="stroke-opacity" values="1;0.35;1" dur="1.2s" repeatCount="indefinite"/>
    ${bracket(-1, -1)}${bracket(1, -1)}${bracket(-1, 1)}${bracket(1, 1)}
  </g>
  <text x="${HX + 74}" y="${HY - 82}" text-anchor="end" font-family="${MONO}" font-size="10" font-weight="700" letter-spacing="2" fill="${C.red}" class="blink">◉ TARGET LOCKED</text>

  <text x="${W / 2}" y="${H - 18}" text-anchor="middle" font-family="${MONO}" font-size="10" letter-spacing="3" fill="${C.dim}">▼ SCROLL TO DEPLOY ▼
    <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
  </text>`;

  return svgDoc(W, H, body, `${data.name} — Full-Stack Developer`);
}
