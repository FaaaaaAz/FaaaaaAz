// Service record: hackathon wins as spinning 3D medals, plus the campaign
// (education) progress.

import { C, FONT, MONO, esc, r1, r2, svgDoc, hudFrame, hudLabel } from '../lib/util.mjs';
import { coin, renderMesh } from '../lib/mesh3d.mjs';

const W = 1000;
const H = 270;

const MEDALS = [
  { place: '1ST', title: 'April Fintech Challenge', org: 'Incubatec · Solydes · UPB', year: '2026' },
  { place: '1ST', title: 'Solutions for My City Hackathon', org: 'Municipal Government of La Paz', year: '2026' },
];

const CAMPAIGN = {
  title: 'B.S. Computer Systems Engineering',
  org: 'Universidad Privada Boliviana (UPB) · La Paz',
  since: 'Feb 2023 – Present',
  semester: 8,
};

const FRAMES = 48;

function medal(x, y, m, i) {
  const dur = 6;
  const offset = i * 0.35; // fraction of a turn, so both medals are not in sync
  // The face label follows the coin's projected width: |cos(angle)|.
  const scales = Array.from({ length: FRAMES + 1 }, (_, f) => {
    const a = (f / FRAMES) * Math.PI * 2;
    return `${r2(Math.max(0.02, Math.abs(Math.cos(a))))} 1`;
  });
  const shiftedMesh = renderMesh(coin(16), {
    cx: x, cy: y, size: 32, color: '#ffc83d', dur, tilt: 0, wobble: 0, frames: FRAMES,
    stroke: '#fff0b8', strokeWidth: 0.6, ambient: 0.4, specular: 0.12, light: [-0.6, 0.55, 0.6],
  }).replaceAll('repeatCount="indefinite"', `repeatCount="indefinite" begin="-${r1(offset * dur)}s"`);

  return `
  <g>
    <path d="M${x - 18} ${y - 52}L${x - 7} ${y - 26}L${x + 7} ${y - 26}L${x + 18} ${y - 52}Z" fill="${C.red}"/>
    <path d="M${x - 6} ${y - 52}L${x} ${y - 26}L${x + 6} ${y - 52}Z" fill="${C.cyan}" opacity="0.9"/>
    ${shiftedMesh}
    <g transform="translate(${x} ${y})">
      <g>
        <animateTransform attributeName="transform" type="scale" values="${scales.join(';')}" dur="${dur}s" begin="-${r1(offset * dur)}s" repeatCount="indefinite"/>
        <text y="7" text-anchor="middle" font-family="${FONT}" font-size="19" font-weight="900" fill="#7a4d00" opacity="0.85">${esc(m.place)}</text>
      </g>
    </g>
    <text x="${x + 50}" y="${y - 22}" font-family="${MONO}" font-size="10" font-weight="800" letter-spacing="2" fill="${C.amber}">★ ${esc(m.place)} PLACE · ${esc(m.year)}</text>
    <text x="${x + 50}" y="${y + 2}" font-family="${FONT}" font-size="16" font-weight="800" fill="${C.text}">${esc(m.title)}</text>
    <text x="${x + 50}" y="${y + 22}" font-family="${MONO}" font-size="10.5" fill="${C.dim}">${esc(m.org)}</text>
  </g>`;
}

function campaign(x, y) {
  const chevrons = Array.from({ length: CAMPAIGN.semester + 1 }, (_, i) => {
    const cx = x + i * 30;
    const done = i < CAMPAIGN.semester;
    const pts = `${cx},${y} ${cx + 20},${y} ${cx + 28},${y + 10} ${cx + 20},${y + 20} ${cx},${y + 20} ${cx + 8},${y + 10}`;
    return done
      ? `<polygon points="${pts}" fill="${C.green}" opacity="0"><animate attributeName="opacity" from="0" to="${r2(0.45 + 0.55 * ((i + 1) / CAMPAIGN.semester))}" begin="${r1(0.3 + i * 0.12)}s" dur="0.3s" fill="freeze"/></polygon>`
      : `<polygon points="${pts}" fill="none" stroke="${C.green}" stroke-dasharray="3 3"><animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite"/></polygon>`;
  }).join('');
  return `
    ${hudLabel(x, y - 92, '// CAMPAIGN', C.green, 12)}
    <text x="${x}" y="${y - 62}" font-family="${FONT}" font-size="16" font-weight="800" fill="${C.text}">${esc(CAMPAIGN.title)}</text>
    <text x="${x}" y="${y - 42}" font-family="${MONO}" font-size="10.5" fill="${C.dim}">${esc(CAMPAIGN.org)}</text>
    <text x="${x}" y="${y - 14}" font-family="${MONO}" font-size="10" font-weight="700" letter-spacing="2" fill="${C.green}">CHAPTER ${String(CAMPAIGN.semester).padStart(2, '0')} IN PROGRESS · ${esc(CAMPAIGN.since.toUpperCase())}</text>
    ${chevrons}`;
}

export function serviceCard() {
  const body = `
  ${hudFrame(W, H, { accent: C.amber, id: 'sv' })}
  ${hudLabel(30, 42, '// SERVICE RECORD', C.amber, 12)}
  <text x="30" y="62" font-family="${MONO}" font-size="11" fill="${C.dim}">MEDALS EARNED IN COMBAT (HACKATHONS)</text>
  ${MEDALS.map((m, i) => medal(70, 128 + i * 84, m, i)).join('')}
  <line x1="500" y1="34" x2="500" y2="${H - 30}" stroke="${C.line2}" stroke-dasharray="3 5"/>
  ${campaign(524, 192)}`;
  return svgDoc(W, H, body, 'Service record: hackathon medals and education');
}
