// Collects everything the cards need from public GitHub endpoints.
// The contribution calendar is read from the public profile HTML (same data
// GitHub shows on the profile), the rest from the REST API.

const API = 'https://api.github.com';

function headers(token) {
  const h = { 'User-Agent': 'faaaaaaz-profile-generator', Accept: 'application/vnd.github+json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function getJson(url, token) {
  const res = await fetch(url, { headers: headers(token) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res.json();
}

async function tryJson(url, token) {
  try {
    return await getJson(url, token);
  } catch (err) {
    console.warn(`[warn] ${err.message}`);
    return null;
  }
}

export function parseCalendar(html) {
  const counts = new Map();
  const tipRe = /<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g;
  for (const m of html.matchAll(tipRe)) {
    const n = /^\s*([\d,]+)\s+contribution/.exec(m[2]);
    counts.set(m[1], n ? Number(n[1].replace(/,/g, '')) : 0);
  }
  const days = [];
  for (const m of html.matchAll(/<td\b[^>]*\bdata-date="(\d{4}-\d{2}-\d{2})"[^>]*>/g)) {
    const tag = m[0];
    const id = /\bid="([^"]+)"/.exec(tag)?.[1];
    const level = Number(/\bdata-level="(\d)"/.exec(tag)?.[1] ?? 0);
    days.push({ date: m[1], level, count: counts.get(id) ?? (level > 0 ? level : 0) });
  }
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchCalendar(user, query = '') {
  const res = await fetch(`https://github.com/users/${user}/contributions${query}`, {
    headers: { 'User-Agent': 'faaaaaaz-profile-generator' },
  });
  if (!res.ok) throw new Error(`calendar ${res.status}`);
  return parseCalendar(await res.text());
}

function streaks(days) {
  let longest = { len: 0, start: null, end: null };
  let run = 0;
  let runStart = null;
  for (const d of days) {
    if (d.count > 0) {
      if (run === 0) runStart = d.date;
      run++;
      if (run > longest.len) longest = { len: run, start: runStart, end: d.date };
    } else run = 0;
  }
  // Current streak: today may still be empty without breaking the streak.
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i--;
  let current = 0;
  while (i >= 0 && days[i].count > 0) {
    current++;
    i--;
  }
  return { longest, current };
}

export async function collect(user, token) {
  const profile = await getJson(`${API}/users/${user}`, token);
  const lastYear = await fetchCalendar(user);
  const today = lastYear.at(-1)?.date ?? new Date().toISOString().slice(0, 10);

  // All-time calendar, one request per year since the account was created.
  const all = new Map();
  const firstYear = Number(profile.created_at.slice(0, 4));
  for (let y = firstYear; y <= Number(today.slice(0, 4)); y++) {
    try {
      for (const d of await fetchCalendar(user, `?from=${y}-01-01&to=${y}-12-31`)) {
        if (d.date <= today) all.set(d.date, d);
      }
    } catch (err) {
      console.warn(`[warn] year ${y}: ${err.message}`);
    }
  }
  for (const d of lastYear) all.set(d.date, d);
  const allDays = [...all.values()].sort((a, b) => a.date.localeCompare(b.date));

  const repos = (await tryJson(`${API}/users/${user}/repos?per_page=100&type=owner&sort=pushed`, token)) ?? [];
  const search = async (q) => (await tryJson(`${API}/search/issues?q=${encodeURIComponent(q)}&per_page=1`, token))?.total_count ?? null;
  const commits = (await tryJson(`${API}/search/commits?q=${encodeURIComponent(`author:${user}`)}&per_page=1`, token))?.total_count ?? null;
  const prs = await search(`author:${user} type:pr`);
  const issues = await search(`author:${user} type:issue`);

  const langCount = new Map();
  for (const r of repos) {
    if (!r.language) continue;
    langCount.set(r.language, (langCount.get(r.language) ?? 0) + 1);
  }
  const languages = [...langCount.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const yearTotal = lastYear.reduce((s, d) => s + d.count, 0);
  const allTotal = allDays.reduce((s, d) => s + d.count, 0);
  const activeDays = lastYear.filter((d) => d.count > 0).length;
  const best = lastYear.reduce((b, d) => (d.count > (b?.count ?? -1) ? d : b), null);
  const { longest, current } = streaks(allDays);

  return {
    user,
    name: profile.name ?? user,
    createdAt: profile.created_at,
    today,
    calendar: lastYear,
    yearTotal,
    allTotal,
    activeDays,
    accuracy: lastYear.length ? activeDays / lastYear.length : 0,
    best,
    longest,
    current,
    repos: repos.length || profile.public_repos,
    stars: repos.reduce((s, r) => s + (r.stargazers_count ?? 0), 0),
    commits,
    prs,
    issues,
    languages,
  };
}
