// Turns all-time contributions into a shooter-style level and competitive rank.

const TIERS = [
  { name: 'RECRUIT', min: 0, color: '#8b96a8' },
  { name: 'BRONZE', min: 100, color: '#d4844a' },
  { name: 'SILVER', min: 300, color: '#c9d3e0' },
  { name: 'GOLD', min: 600, color: '#ffc83d' },
  { name: 'PLATINUM', min: 1000, color: '#3fe0c5' },
  { name: 'DIAMOND', min: 2000, color: '#6fb6ff' },
  { name: 'MASTER', min: 4000, color: '#b46bff' },
  { name: 'GRANDMASTER', min: 7000, color: '#ff4655' },
  { name: 'LEGEND', min: 12000, color: '#ff9d1c' },
];

const XP_K = 4; // XP required to reach level L is XP_K * (L - 1)^2

export function progression(xp) {
  const level = Math.floor(Math.sqrt(xp / XP_K)) + 1;
  const floor = XP_K * (level - 1) ** 2;
  const next = XP_K * level ** 2;

  let t = 0;
  while (t + 1 < TIERS.length && xp >= TIERS[t + 1].min) t++;
  const tier = TIERS[t];
  const nextTier = TIERS[t + 1];
  let division = '';
  if (nextTier) {
    const span = (xp - tier.min) / (nextTier.min - tier.min);
    division = span < 1 / 3 ? 'III' : span < 2 / 3 ? 'II' : 'I';
  }

  return {
    xp,
    level,
    levelFloor: floor,
    levelNext: next,
    levelProgress: (xp - floor) / (next - floor),
    tier: tier.name,
    division,
    rank: division ? `${tier.name} ${division}` : tier.name,
    color: tier.color,
    nextTier: nextTier?.name ?? null,
    toNextTier: nextTier ? nextTier.min - xp : 0,
  };
}
