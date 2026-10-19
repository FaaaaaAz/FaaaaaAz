// Tiny software 3D renderer: rotates a convex mesh, flat-shades each face and
// bakes every frame into SMIL <animate> values, so the result is a plain SVG
// that GitHub can display (no JavaScript needed at view time).

import { hexToRgb, rgbToHex, r1 } from './util.mjs';

const norm = (v) => {
  const l = Math.hypot(...v) || 1;
  return v.map((c) => c / l);
};
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export function icosahedron() {
  const t = (1 + Math.sqrt(5)) / 2;
  const verts = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ].map(norm);
  const faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  return { verts, faces };
}

/** Brilliant-cut style gem: table, crown ring, girdle and a pointed pavilion. */
export function gem(sides = 8) {
  const verts = [];
  const ring = (y, r, off = 0) => {
    const start = verts.length;
    for (let i = 0; i < sides; i++) {
      const a = ((i + off) / sides) * Math.PI * 2;
      verts.push([Math.cos(a) * r, y, Math.sin(a) * r]);
    }
    return start;
  };
  const table = ring(0.62, 0.52, 0.5);
  const girdle = ring(0.18, 1);
  verts.push([0, -1.25, 0]);
  const tip = verts.length - 1;
  const faces = [];
  faces.push(Array.from({ length: sides }, (_, i) => table + i));
  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides;
    faces.push([table + i, girdle + j, girdle + i]);
    faces.push([table + i, table + j, girdle + j]);
    faces.push([girdle + i, girdle + j, tip]);
  }
  return { verts, faces };
}

/** A coin: a short cylinder facing the camera (axis along z). */
export function coin(sides = 20, thickness = 0.16) {
  const verts = [];
  for (const z of [thickness, -thickness]) {
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2;
      verts.push([Math.cos(a), Math.sin(a), z]);
    }
  }
  const faces = [
    Array.from({ length: sides }, (_, i) => i),
    Array.from({ length: sides }, (_, i) => sides + i),
  ];
  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides;
    faces.push([i, j, sides + j, sides + i]);
  }
  return { verts, faces };
}

function rotate([x, y, z], ay, ax) {
  const cy = Math.cos(ay), sy = Math.sin(ay);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const cx = Math.cos(ax), sx = Math.sin(ax);
  return [x1, y * cx - z1 * sx, y * sx + z1 * cx];
}

/**
 * Render a rotating convex mesh as animated SVG paths.
 * Back faces are culled per frame (opacity toggled discretely), so no depth
 * sorting is needed as long as the mesh is convex and centered at the origin.
 */
export function renderMesh(mesh, opts) {
  const {
    cx, cy, size,
    frames = 72, dur = 9,
    tilt = 0.38, wobble = 0.12,
    color = '#29e7ff', ambient = 0.22,
    light = [-0.55, 0.65, 0.75],
    stroke = null, strokeWidth = 1, fillOpacity = 1,
    specular = 0.35,
  } = opts;
  const L = norm(light);
  const base = hexToRgb(color);
  const out = mesh.faces.map(() => ({ d: [], fill: [], nz: [] }));

  for (let f = 0; f <= frames; f++) {
    const a = (f / frames) * Math.PI * 2;
    const ax = tilt + wobble * Math.sin(a);
    const vs = mesh.verts.map((v) => rotate(v, a, ax));
    mesh.faces.forEach((face, i) => {
      const p = face.map((k) => vs[k]);
      let n = norm(cross(sub(p[1], p[0]), sub(p[2], p[0])));
      const centroid = p.reduce((s, q) => [s[0] + q[0], s[1] + q[1], s[2] + q[2]], [0, 0, 0]);
      if (dot(n, centroid) < 0) n = n.map((c) => -c);
      const diff = Math.max(0, dot(n, L));
      const spec = specular * Math.max(0, n[2] * 0.2 + dot(n, L) - 0.55) ** 2 * 4;
      const k = ambient + (1 - ambient) * diff;
      const rgb = base.map((c) => c * k + 255 * spec);
      out[i].d.push('M' + p.map((q) => `${r1(cx + q[0] * size)} ${r1(cy - q[1] * size)}`).join('L') + 'Z');
      out[i].fill.push(rgbToHex(rgb));
      out[i].nz.push(n[2]);
    });
  }

  const anim = (attr, values, extra = '') =>
    `<animate attributeName="${attr}" dur="${dur}s" repeatCount="indefinite" values="${values.join(';')}"${extra}/>`;

  return out
    .map((o) => {
      // Visible during frame f -> f+1 if it faces the camera on average.
      const vis = o.nz.slice(0, frames).map((z, f) => (z + o.nz[f + 1] > 0 ? 1 : 0));
      if (vis.every((v) => v === 0)) return '';
      const strokeAttr = stroke ? ` stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"` : '';
      return (
        `<path d="${o.d[0]}" fill="${o.fill[0]}" fill-opacity="${fillOpacity}" opacity="${vis[0]}"${strokeAttr}>` +
        anim('d', o.d) +
        anim('fill', o.fill) +
        anim('opacity', vis, ' calcMode="discrete"') +
        `</path>`
      );
    })
    .join('');
}
