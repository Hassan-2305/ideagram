import { CHALLENGES, type Challenge, type ChallengeKind } from "@/data/challenges";

export type { Challenge, ChallengeKind };

export const KIND_META: Record<ChallengeKind, { label: string; blurb: string }> = {
  "problem-first": { label: "Problem First", blurb: "A real problem, no solution in sight. Think before you see answers." },
  "what-would-you-build": { label: "What Would You Build?", blurb: "An unexpected scenario. Invent something for it." },
  "connect-the-dots": { label: "Connect the Dots", blurb: "Two unrelated concepts. Find the bridge." },
  constraint: { label: "Constraint Challenge", blurb: "Unusual limits that force original solutions." },
  "reverse-engineer": { label: "Reverse Engineering", blurb: "Take apart a successful product to see why it works." },
};

export const KINDS = Object.keys(KIND_META) as ChallengeKind[];

export function getChallenge(slug: string): Challenge | undefined {
  return CHALLENGES.find((c) => c.slug === slug);
}

export function challengesByKind(kind: ChallengeKind): Challenge[] {
  return CHALLENGES.filter((c) => c.kind === kind);
}

/** Same challenge for everyone on a given UTC day, rotating across kinds. */
export function dailyChallenge(date = new Date()): Challenge {
  const day = Math.floor(date.getTime() / 86_400_000);
  const kind = KINDS[day % KINDS.length];
  const pool = challengesByKind(kind);
  return pool[Math.floor(day / KINDS.length) % pool.length];
}

/** Next suggested challenge: an uncompleted one, preferring kinds the user has done least. */
export function suggestNext(completed: string[], byKind: Record<string, number>): Challenge | undefined {
  const done = new Set(completed);
  const kinds = [...KINDS].sort((a, b) => (byKind[a] ?? 0) - (byKind[b] ?? 0));
  for (const k of kinds) {
    const c = challengesByKind(k).find((x) => !done.has(x.slug));
    if (c) return c;
  }
  return undefined;
}

export { CHALLENGES };
