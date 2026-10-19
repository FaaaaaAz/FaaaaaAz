// Builds every profile card into ./dist. Run by .github/workflows/profile.yml
// (pushed to the `output` branch) or locally with `npm run generate`.
//   GITHUB_USER   profile to render (defaults to FaaaaaAz)
//   GITHUB_TOKEN  optional, raises API rate limits

import { mkdir, writeFile } from 'node:fs/promises';
import { collect } from './lib/data.mjs';
import { progression } from './lib/rank.mjs';
import { headerCard } from './cards/header.mjs';
import { operatorCard } from './cards/operator.mjs';
import { arenaCard } from './cards/arena.mjs';
import { systemCard } from './cards/system.mjs';
import { loadoutCard } from './cards/loadout.mjs';
import { serviceCard } from './cards/service.mjs';

const user = process.env.GITHUB_USER || 'FaaaaaAz';
const out = new URL('../dist/', import.meta.url);

const data = await collect(user, process.env.GITHUB_TOKEN);
const prog = progression(data.allTotal);

const cards = {
  'header.svg': headerCard(data, prog),
  'operator.svg': operatorCard(data, prog),
  'arena.svg': arenaCard(data),
  'system.svg': systemCard(data),
  'loadout.svg': loadoutCard(),
  'service.svg': serviceCard(),
};

await mkdir(out, { recursive: true });
for (const [name, svg] of Object.entries(cards)) {
  await writeFile(new URL(name, out), svg);
  console.log(`${name.padEnd(14)} ${(svg.length / 1024).toFixed(1)} KB`);
}
console.log(
  `\n${data.name}: ${data.allTotal} all-time / ${data.yearTotal} last year · ${prog.rank} · LVL ${prog.level} · ` +
    `streak ${data.current} (best ${data.longest.len}) · ${data.commits} commits · ${data.prs} PRs · ${data.issues} issues`,
);
