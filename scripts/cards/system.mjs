// Language star system: a rotating low-poly 3D core and one planet per
// language on tilted orbits. Each planet exists twice (behind and in front of
// the core) and swaps copies as it crosses the far/near half of its orbit, so
// it truly passes behind the sun. Size also scales with depth.

import { C, FONT, MONO, esc, r1, r2, svgDoc, hudFrame, hudLabel, mix, shade } from '../lib/util.mjs';
import { icosahedron, renderMesh } from '../lib/mesh3d.mjs';

const W = 1000;
const H = 470;
const CX = 380;
const CY = 250;
const SAMPLES = 60;
const MAX_PLANETS = 7;

const LANG_COLORS = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572a5', Java: '#b07219',
  'C#': '#178600', GDScript: '#478cbf', HTML: '#e34c26', CSS: '#563d7c', Shell: '#89e051',
  HCL: '#844fba', Kotlin: '#a97bff', 'Wolfram Language': '#dd1100', Go: '#00add8',
  Rust: '#dea584', 'C++': '#f34b7d', C: '#555555', PHP: '#4f5d95', Dart: '#00b4ab',
};

function hashColor(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `hsl(${h % 360} 70% 60%)`;
}

// Deterministic pseudo-random so the starfield is stable between runs.
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function systemCard(data) {
  const langs = data.languages.slice(0, MAX_PLANETS);
  const totalRepos = data.languages.reduce((s, l) => s + l.count, 0) || 1;
  const maxCount = Math.max(1, ...langs.map((l) => l.count));

  const rand = rng(42);
  const stars = Array.from({ length: 110 }, (_, i) => {
    const x = r1(rand() * W);
    const y = r1(rand() * H);
    const r = r1(0.4 + rand() * 1.2);
    const tw = i % 4 === 0
      ? `<animate attributeName="opacity" values="0.9;0.15;0.9" dur="${r1(2 + rand() * 4)}s" begin="${r1(rand() * 3)}s" repeatCount="indefinite"/>`
      : '';
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#cfe9ff" opacity="${r1(0.25 + rand() * 0.5)}">${tw}</circle>`;
  }).join('');

  const back = [];
  const front = [];
  const orbitsBack = [];
  const orbitsFront = [];
  const defs = [];

  langs.forEach((lang, i) => {
    const color = LANG_COLORS[lang.name] ?? hashColor(lang.name);
    const rx = 96 + i * 39;
    const ry = rx * 0.36;
    const period = r1(7 * (rx / 96) ** 1.5);
    const phase = i * 2.1;
    const radius = 8 + 12 * Math.sqrt(lang.count / maxCount);

    // Orbit drawn in two halves so the near half sits on top of the core.
    orbitsBack.push(`<path d="M${CX - rx} ${CY}A${rx} ${ry} 0 0 1 ${CX + rx} ${CY}" fill="none" stroke="${color}" stroke-opacity="0.22" stroke-dasharray="2 5"/>`);
    orbitsFront.push(`<path d="M${CX + rx} ${CY}A${rx} ${ry} 0 0 1 ${CX - rx} ${CY}" fill="none" stroke="${color}" stroke-opacity="0.45" stroke-dasharray="2 5"/>`);

    const pos = [];
    const scale = [];
    const near = [];
    for (let k = 0; k <= SAMPLES; k++) {
      const a = phase + (k / SAMPLES) * Math.PI * 2;
      pos.push(`${r1(CX + rx * Math.cos(a))} ${r1(CY + ry * Math.sin(a))}`);
      scale.push(r2(0.8 + 0.2 * Math.sin(a)));
      if (k < SAMPLES) near.push(Math.sin(phase + ((k + 0.5) / SAMPLES) * Math.PI * 2) > 0 ? 1 : 0);
    }
    const anim = (extra) => `dur="${period}s" repeatCount="indefinite" ${extra}`;

    defs.push(`<radialGradient id="pl${i}" cx="0.35" cy="0.32" r="0.75">
      <stop offset="0" stop-color="${mix(color, '#ffffff', 0.55)}"/>
      <stop offset="0.45" stop-color="${color}"/>
      <stop offset="1" stop-color="${shade(color, 0.18)}"/>
    </radialGradient>`);

    const ringed = i === 0;
    const ringBack = ringed
      ? `<path d="M${-radius * 2} 0A${radius * 2} ${radius * 0.55} 0 0 1 ${radius * 2} 0" fill="none" stroke="${mix(color, '#ffffff', 0.4)}" stroke-width="2.4" opacity="0.7"/>`
      : '';
    const ringFront = ringed
      ? `<path d="M${radius * 2} 0A${radius * 2} ${radius * 0.55} 0 0 1 ${-radius * 2} 0" fill="none" stroke="${mix(color, '#ffffff', 0.4)}" stroke-width="2.4" opacity="0.9"/>`
      : '';
    const moon = i === 1
      ? `<circle r="2.6" fill="#d8e2ee"><animateMotion dur="3.2s" repeatCount="indefinite" path="M${radius + 9} 0A${radius + 9} ${(radius + 9) * 0.35} 0 1 1 ${-radius - 9} 0A${radius + 9} ${(radius + 9) * 0.35} 0 1 1 ${radius + 9} 0"/></circle>`
      : '';
    const pct = Math.round((lang.count / totalRepos) * 100);

    const planet = (visible) => `<g opacity="${visible[0]}">
      <animate attributeName="opacity" calcMode="discrete" values="${visible.join(';')}" ${anim('')}/>
      <g>
        <animateTransform attributeName="transform" type="translate" values="${pos.join(';')}" ${anim('')}/>
        <g>
          <animateTransform attributeName="transform" type="scale" values="${scale.join(';')}" ${anim('')}/>
          ${ringBack}
          <circle r="${r1(radius)}" fill="url(#pl${i})"/>
          <circle r="${r1(radius)}" fill="none" stroke="${mix(color, '#ffffff', 0.3)}" stroke-opacity="0.35"/>
          ${ringFront}${moon}
        </g>
        <text y="${r1(-radius - 9)}" text-anchor="middle" font-family="${MONO}" font-size="10.5" font-weight="700" fill="${C.text}" stroke="${C.bg}" stroke-width="3" paint-order="stroke">${esc(lang.name)} <tspan fill="${C.dim}" font-weight="400">${pct}%</tspan></text>
      </g>
    </g>`;

    back.push(planet(near.map((v) => 1 - v)));
    front.push(planet(near));
  });

  const legend = langs
    .map((lang, i) => {
      const color = LANG_COLORS[lang.name] ?? hashColor(lang.name);
      const y = 122 + i * 40;
      const pct = lang.count / totalRepos;
      return `<g>
        <circle cx="788" cy="${y}" r="6" fill="${color}"/>
        <text x="802" y="${y + 4}" font-family="${FONT}" font-size="13" font-weight="700" fill="${C.text}">${esc(lang.name)}</text>
        <text x="968" y="${y + 4}" text-anchor="end" font-family="${MONO}" font-size="11" fill="${C.dim}">${lang.count} repo${lang.count === 1 ? '' : 's'}</text>
        <rect x="782" y="${y + 12}" width="186" height="4" rx="2" fill="${C.panel2}"/>
        <rect x="782" y="${y + 12}" width="0" height="4" rx="2" fill="${color}">
          <animate attributeName="width" from="0" to="${r1(186 * pct)}" begin="${r1(0.3 + i * 0.1)}s" dur="1s" fill="freeze"/>
        </rect>
      </g>`;
    })
    .join('');

  const body = `
  ${hudFrame(W, H, { accent: C.amber, id: 'sy' })}
  <defs>
    <radialGradient id="sy-core"><stop offset="0" stop-color="${C.amber}" stop-opacity="0.55"/><stop offset="0.45" stop-color="#ff6a2b" stop-opacity="0.18"/><stop offset="1" stop-color="#ff6a2b" stop-opacity="0"/></radialGradient>
    ${defs.join('')}
  </defs>
  <g clip-path="url(#sy-clip)">${stars}</g>

  ${hudLabel(30, 42, '// SECTOR MAP — LANGUAGE SYSTEM', C.amber, 12)}
  <text x="30" y="62" font-family="${MONO}" font-size="11" fill="${C.dim}">EVERY PLANET IS A LANGUAGE · SIZE = REPOSITORIES · ${data.repos} REPOS SCANNED</text>

  ${orbitsBack.join('')}
  ${back.join('')}

  <circle cx="${CX}" cy="${CY}" r="120" fill="url(#sy-core)">
    <animate attributeName="r" values="110;128;110" dur="4s" repeatCount="indefinite"/>
  </circle>
  <circle cx="${CX}" cy="${CY}" r="56" fill="none" stroke="${C.amber}" stroke-opacity="0.5" stroke-dasharray="3 7">
    <animateTransform attributeName="transform" type="rotate" values="0 ${CX} ${CY};-360 ${CX} ${CY}" dur="30s" repeatCount="indefinite"/>
  </circle>
  ${renderMesh(icosahedron(), {
    cx: CX, cy: CY, size: 40, color: '#ff9a2b', dur: 12, tilt: 0.3, wobble: 0.2,
    stroke: '#ffe2a8', strokeWidth: 0.7, ambient: 0.35, specular: 0.6,
  })}
  <text x="${CX}" y="${CY + 66}" text-anchor="middle" font-family="${MONO}" font-size="10" font-weight="700" letter-spacing="2" fill="${C.amber}" stroke="${C.bg}" stroke-width="3" paint-order="stroke">CORE · ${esc(data.user.toUpperCase())}</text>

  ${orbitsFront.join('')}
  ${front.join('')}

  <line x1="762" y1="34" x2="762" y2="${H - 30}" stroke="${C.line2}" stroke-dasharray="3 5"/>
  ${hudLabel(782, 42, '// INTEL', C.amber, 12)}
  <text x="782" y="62" font-family="${MONO}" font-size="10" fill="${C.dim}">PRIMARY LANGUAGE PER REPO</text>
  <text x="782" y="88" font-family="${FONT}" font-size="22" font-weight="800" fill="${C.text}">${esc(langs[0]?.name ?? '—')}<tspan font-family="${MONO}" font-size="10" font-weight="400" fill="${C.dim}" dx="8">DOMINANT</tspan></text>
  ${legend}`;

  return svgDoc(W, H, body, `Language star system: ${langs.map((l) => l.name).join(', ')}`);
}
