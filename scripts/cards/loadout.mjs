// Tech stack as a shooter loadout screen. Icons come from simple-icons and
// are embedded as paths (GitHub blocks external images inside SVGs).

import * as si from 'simple-icons';
import { C, FONT, MONO, esc, r1, svgDoc, hudFrame, hudLabel, luminance, shade } from '../lib/util.mjs';

const W = 1000;

// [label, simple-icons key | null, monogram, fallback color]
const SLOTS = [
  { tag: 'PRIMARY', title: 'LANGUAGES', color: C.red, items: [
    ['TypeScript', 'siTypescript'], ['JavaScript', 'siJavascript'], ['Python', 'siPython'], ['Kotlin', 'siKotlin'],
  ] },
  { tag: 'SECONDARY', title: 'WEB', color: C.red, items: [
    ['React', 'siReact'], ['Node.js', 'siNodedotjs'], ['Express', 'siExpress'], ['HTML5', 'siHtml5'], ['CSS', 'siCss'], ['Tailwind', 'siTailwindcss'],
  ] },
  { tag: 'SIDEARM', title: 'MOBILE', color: C.cyan, items: [
    ['React Native', 'siReact'], ['Android Studio', 'siAndroidstudio'], ['Kotlin', 'siKotlin'],
  ] },
  { tag: 'ARMOR', title: 'DATABASES', color: C.cyan, items: [
    ['PostgreSQL', 'siPostgresql'], ['MongoDB', 'siMongodb'], ['Prisma', 'siPrisma'], ['pgvector', null, 'pgV', '#336791'],
  ] },
  { tag: 'ULTIMATE', title: 'ARTIFICIAL INTELLIGENCE', color: C.amber, wide: true, items: [
    ['Prompt Eng.', null, 'PE', '#8a2be2'], ['RAG', null, 'RAG', '#6a3fd6'], ['Claude API', 'siClaude'], ['Llama 3.1', 'siMeta'],
    ['NVIDIA NIM', 'siNvidia'], ['Gemini', 'siGooglegemini'], ['OpenAI', null, 'AI', '#10a37f'],
  ] },
  { tag: 'UTILITY', title: 'DEVOPS & CLOUD', color: C.green, items: [
    ['Docker', 'siDocker'], ['Git', 'siGit'], ['AWS', null, 'AWS', '#ff9900'], ['Vercel', 'siVercel'],
  ] },
  { tag: 'TACTICAL', title: 'UX/UI DESIGN', color: C.green, items: [
    ['Figma', 'siFigma'], ['Design Thinking', null, 'DT', '#ff6f61'], ['HCI', null, 'HCI', '#00a99d'],
  ] },
  { tag: 'PERK', title: 'GAME DEV & MULTIMEDIA', color: C.purple, items: [
    ['Unity', 'siUnity'], ['Godot', 'siGodotengine'], ['Blender', 'siBlender'], ['Canva', null, 'Cv', '#00c4cc'],
    ['CapCut', null, 'CC', '#e8eef6'], ['PowerDirector', null, 'PD', '#8e44ad'],
  ] },
  { tag: 'COMMS', title: 'LANGUAGES SPOKEN', color: C.purple, items: [
    ['Spanish · Native', null, 'ES', '#ffb020'], ['English · Interm.', null, 'EN', '#29e7ff'],
  ] },
];

const SLOT_H = 112;
const GAP = 12;
const TOP = 70;
const PAD = 24;
const COL_W = (W - PAD * 2 - GAP) / 2;

function iconChip(x, y, [label, key, mono, fallback]) {
  const w = Math.max(64, label.length * 6.1 + 16);
  const icon = key ? si[key] : null;
  let glyph;
  if (icon) {
    let color = `#${icon.hex}`;
    if (luminance(color) < 0.06) color = '#e8eef6';
    glyph = `<g transform="translate(${r1(x + w / 2 - 13)} ${y + 10}) scale(${26 / 24})"><path d="${icon.path}" fill="${color}"/></g>`;
  } else {
    glyph = `<rect x="${r1(x + w / 2 - 14)}" y="${y + 9}" width="28" height="28" rx="6" fill="${shade(fallback, 0.25)}" stroke="${fallback}"/>
      <text x="${r1(x + w / 2)}" y="${y + 27.5}" text-anchor="middle" font-family="${MONO}" font-size="${mono.length > 2 ? 9.5 : 12}" font-weight="800" fill="${fallback}">${esc(mono)}</text>`;
  }
  return {
    w,
    svg: `<rect x="${r1(x)}" y="${y}" width="${r1(w)}" height="64" rx="6" fill="${C.bg}" fill-opacity="0.6" stroke="${C.line}"/>
      ${glyph}
      <text x="${r1(x + w / 2)}" y="${y + 54}" text-anchor="middle" font-family="${FONT}" font-size="10" font-weight="600" fill="${C.text}">${esc(label)}</text>`,
  };
}

export function loadoutCard() {
  let row = 0;
  let col = 0;
  const parts = [];
  SLOTS.forEach((slot, i) => {
    if (slot.wide && col === 1) {
      row++;
      col = 0;
    }
    const x = PAD + col * (COL_W + GAP);
    const y = TOP + row * (SLOT_H + GAP);
    const w = slot.wide ? W - PAD * 2 : COL_W;
    const id = `lo${i}`;
    let cx = x + 16;
    const chips = slot.items.map((item) => {
      const chip = iconChip(cx, y + 36, item);
      cx += chip.w + 7;
      return chip.svg;
    });
    const glintDelay = r1(i * 0.45);
    parts.push(`<g>
      <clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${SLOT_H}" rx="8"/></clipPath>
      <rect x="${x}" y="${y}" width="${w}" height="${SLOT_H}" rx="8" fill="${C.panel2}" stroke="${slot.wide ? slot.color : C.line2}" stroke-opacity="${slot.wide ? 0.8 : 1}"/>
      <g clip-path="url(#${id})">
        <rect x="${x}" y="${y}" width="4" height="${SLOT_H}" fill="${slot.color}"/>
        <polygon points="${x - 120},${y} ${x - 60},${y} ${x - 110},${y + SLOT_H} ${x - 170},${y + SLOT_H}" fill="#ffffff" opacity="0.06">
          <animateTransform attributeName="transform" type="translate" values="0 0;${w + 240} 0;${w + 240} 0" keyTimes="0;0.35;1" dur="5s" begin="${glintDelay}s" repeatCount="indefinite"/>
        </polygon>
      </g>
      <text x="${x + 16}" y="${y + 23}" font-family="${MONO}" font-size="11" font-weight="800" letter-spacing="2" fill="${slot.color}">${esc(slot.tag)}</text>
      <text x="${x + 16 + slot.tag.length * 8.6 + 10}" y="${y + 23}" font-family="${MONO}" font-size="11" letter-spacing="1" fill="${C.dim}">// ${esc(slot.title)}</text>
      <text x="${x + w - 14}" y="${y + 23}" text-anchor="end" font-family="${MONO}" font-size="10" font-weight="700" fill="${C.faint}">[${i + 1}]</text>
      ${slot.wide ? `<text x="${x + w - 44}" y="${y + 23}" text-anchor="end" font-family="${MONO}" font-size="10" font-weight="800" letter-spacing="2" fill="${slot.color}">READY<animate attributeName="opacity" values="1;0.25;1" dur="1.4s" repeatCount="indefinite"/></text>` : ''}
      ${chips.join('')}
    </g>`);
    if (slot.wide || col === 1) {
      row++;
      col = 0;
    } else col = 1;
  });
  if (col === 1) row++;
  const H = TOP + row * (SLOT_H + GAP) + 12;

  const body = `
  ${hudFrame(W, H, { accent: C.red, id: 'lo' })}
  ${hudLabel(PAD + 6, 42, '// LOADOUT', C.red, 12)}
  <text x="${PAD + 112}" y="42" font-family="${MONO}" font-size="11" fill="${C.dim}">TECH STACK · ${SLOTS.reduce((s, x) => s + x.items.length, 0)} ITEMS EQUIPPED</text>
  ${parts.join('')}`;
  return svgDoc(W, H, body, 'Tech stack loadout');
}
