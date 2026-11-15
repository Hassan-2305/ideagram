import type { Idea } from "./types";

/**
 * Pure recommendation logic (no DB access) so it can be unit tested.
 *
 * Optimizes for useful discovery, not time-on-app:
 *  - affinity from explicit preferences + meaningful actions (save/remix/build
 *    count far more than views; hides push categories away)
 *  - controlled exploration: a fraction of slots go to categories the user
 *    rarely touches ("blind spots")
 *  - diversity: no more than two consecutive cards from one category
 *  - already-saved ideas are demoted so the feed keeps moving
 */

export const ACTION_WEIGHTS: Record<string, number> = {
  view: 0.3,
  like: 1.5,
  interesting: 1.5,
  save: 3,
  remix: 3,
  build: 4,
  hide: -4,
};

export interface UserSignals {
  preferredCategories: string[];
  technologies: string[];
  difficulty: string | null;
  exploration: number; // 0..1
  categoryActions: { category: string; kind: string; n: number }[];
  savedIds: Set<string>;
  personalization: boolean;
}

export type Affinity = Record<string, number>;

export function computeAffinity(s: UserSignals): Affinity {
  const aff: Affinity = {};
  for (const c of s.preferredCategories) aff[c] = (aff[c] ?? 0) + 4;
  for (const a of s.categoryActions) {
    const w = ACTION_WEIGHTS[a.kind] ?? 0;
    // diminishing returns: log scale on repeated actions
    aff[a.category] = (aff[a.category] ?? 0) + w * Math.log2(1 + a.n);
  }
  return aff;
}

/** Deterministic PRNG so a feed page is stable within a day but varies across days. */
export function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ScoredIdea {
  idea: Idea & { quality?: number };
  score: number;
  reason: "match" | "explore" | "fresh" | "popular";
}

export function scoreIdeas(
  ideas: (Idea & { quality?: number })[],
  s: UserSignals,
  seed: string,
  now = Date.now(),
): ScoredIdea[] {
  const aff = s.personalization ? computeAffinity(s) : {};
  const rand = seededRandom(seed);
  const techs = s.technologies.map((t) => t.toLowerCase());
  const maxAff = Math.max(1, ...Object.values(aff));
  return ideas.map((idea) => {
    const a = (aff[idea.category] ?? 0) / maxAff; // -inf..1
    const techHit = techs.length
      ? idea.stack.filter((st) => techs.some((t) => st.toLowerCase().includes(t))).length
      : 0;
    const ageDays = (now - new Date(idea.publishedAt ?? idea.createdAt).getTime()) / 86_400_000;
    const freshness = Math.exp(-Math.max(0, ageDays) / 21); // ~3 week half-life-ish
    const popularity = Math.log2(1 + idea.likeCount + 2 * idea.saveCount) / 6;
    const diffMatch = s.difficulty && idea.difficulty === s.difficulty ? 0.25 : 0;
    let score =
      (idea.quality ?? 0.5) * 1.0 +
      a * 1.6 +
      Math.min(techHit, 3) * 0.35 +
      freshness * 0.6 +
      popularity * 0.5 +
      diffMatch +
      rand() * 0.35; // gentle shuffle so the feed is not static
    if (s.savedIds.has(idea.id)) score -= 1.5;
    const reason: ScoredIdea["reason"] =
      a > 0.3 || techHit > 0 ? "match" : freshness > 0.7 ? "fresh" : popularity > 0.5 ? "popular" : "match";
    return { idea, score, reason };
  });
}

/**
 * Picks `limit` ideas: mostly best-scored, with `exploration` share drawn from
 * low-affinity categories, then re-ordered to avoid category runs.
 */
export function rankFeed(scored: ScoredIdea[], s: UserSignals, limit: number, seed: string): ScoredIdea[] {
  const aff = s.personalization ? computeAffinity(s) : {};
  const sorted = [...scored].sort((x, y) => y.score - x.score);
  const hasSignal = s.personalization && Object.keys(aff).length > 0;
  const exploreSlots = hasSignal ? Math.round(limit * Math.min(0.6, Math.max(0, s.exploration))) : 0;

  const lowAffinity = (c: string) => (aff[c] ?? 0) <= 0.5;
  const explore = sorted.filter((x) => lowAffinity(x.idea.category));
  const rand = seededRandom(seed + ":explore");
  // shuffle the exploration pool a little so blind spots rotate
  for (let i = explore.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [explore[i], explore[j]] = [explore[j], explore[i]];
  }
  const picked: ScoredIdea[] = [];
  const used = new Set<string>();
  const exploreCats = new Set<string>();
  for (const x of explore) {
    if (picked.length >= exploreSlots) break;
    if (exploreCats.has(x.idea.category)) continue; // one per blind-spot category
    exploreCats.add(x.idea.category);
    picked.push({ ...x, reason: "explore" });
    used.add(x.idea.id);
  }
  for (const x of sorted) {
    if (picked.length >= limit) break;
    if (!used.has(x.idea.id)) {
      picked.push(x);
      used.add(x.idea.id);
    }
  }
  return diversify(picked.sort((a, b) => b.score - a.score));
}

/** Reorders so no more than two consecutive items share a category. */
export function diversify<T extends { idea: { category: string } }>(items: T[]): T[] {
  const pool = [...items];
  const out: T[] = [];
  while (pool.length) {
    const n = out.length;
    const blocked = n >= 2 && out[n - 1].idea.category === out[n - 2].idea.category ? out[n - 1].idea.category : null;
    const idx = pool.findIndex((x) => x.idea.category !== blocked);
    out.push(pool.splice(idx === -1 ? 0 : idx, 1)[0]);
  }
  return out;
}
