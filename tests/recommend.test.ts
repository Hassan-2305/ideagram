import { describe, expect, it } from "vitest";
import { balanceSources, computeAffinity, diversify, rankFeed, scoreIdeas, seededRandom, type UserSignals } from "@/lib/recommend";
import type { Idea } from "@/lib/types";

const base = (over: Partial<Idea>): Idea => ({
  id: "x",
  title: "t",
  summary: "s",
  problem: "",
  solution: "",
  insight: "",
  category: "ai-ml",
  difficulty: "intermediate",
  buildTime: "",
  stack: [],
  tags: [],
  sourceKind: "editorial",
  sourceName: "Idea Gym Editorial",
  sourceUrl: null,
  creator: null,
  publishedAt: "2026-10-01T00:00:00Z",
  createdAt: "2026-10-01T00:00:00Z",
  ownerId: null,
  isPublic: true,
  details: null,
  parentIds: [],
  likeCount: 0,
  saveCount: 0,
  ...over,
});

const signals = (over: Partial<UserSignals> = {}): UserSignals => ({
  preferredCategories: [],
  technologies: [],
  difficulty: null,
  exploration: 0.25,
  categoryActions: [],
  savedIds: new Set(),
  personalization: true,
  ...over,
});

describe("affinity", () => {
  it("weights meaningful actions above views and penalises hides", () => {
    const a = computeAffinity(
      signals({
        categoryActions: [
          { category: "finance", kind: "view", n: 20 },
          { category: "hardware", kind: "build", n: 1 },
          { category: "design", kind: "hide", n: 2 },
        ],
      }),
    );
    expect(a.hardware).toBeGreaterThan(a.finance);
    expect(a.design).toBeLessThan(0);
  });

  it("counts explicit preferences", () => {
    expect(computeAffinity(signals({ preferredCategories: ["education"] })).education).toBe(4);
  });
});

describe("ranking", () => {
  const cats = ["ai-ml", "ai-ml", "ai-ml", "ai-ml", "finance", "design", "hardware", "education"] as const;
  const ideas = cats.map((c, i) => base({ id: `i${i}`, category: c }));

  it("ranks preferred categories higher", () => {
    const s = signals({ preferredCategories: ["finance"], exploration: 0 });
    const ranked = rankFeed(scoreIdeas(ideas, s, "seed", Date.parse("2026-10-02")), s, ideas.length, "seed");
    expect(ranked[0].idea.category).toBe("finance");
  });

  it("reserves exploration slots for blind-spot categories", () => {
    const s = signals({ preferredCategories: ["ai-ml"], exploration: 0.5 });
    const ranked = rankFeed(scoreIdeas(ideas, s, "seed"), s, 4, "seed");
    expect(ranked.filter((r) => r.reason === "explore").length).toBe(2);
    expect(ranked.some((r) => r.idea.category !== "ai-ml")).toBe(true);
  });

  it("does not explore when personalization is off", () => {
    const s = signals({ preferredCategories: ["ai-ml"], exploration: 0.5, personalization: false });
    const ranked = rankFeed(scoreIdeas(ideas, s, "seed"), s, 4, "seed");
    expect(ranked.some((r) => r.reason === "explore")).toBe(false);
  });

  it("demotes already-saved ideas", () => {
    const s = signals({ savedIds: new Set(["i0"]) });
    const scored = scoreIdeas([base({ id: "i0" }), base({ id: "i1" })], s, "seed");
    expect(scored[0].score).toBeLessThan(scored[1].score + 1);
    const ranked = rankFeed(scored, s, 2, "seed");
    expect(ranked[0].idea.id).toBe("i1");
  });

  it("never shows three in a row from one category when alternatives exist", () => {
    const out = diversify(ideas.map((idea) => ({ idea })));
    for (let i = 2; i < out.length; i++) {
      const same = out[i].idea.category === out[i - 1].idea.category && out[i - 1].idea.category === out[i - 2].idea.category;
      const remainingOthers = out.slice(i).some((x) => x.idea.category !== out[i].idea.category);
      if (remainingOthers) expect(same).toBe(false);
    }
    expect(out).toHaveLength(ideas.length);
  });

  it("limits raw external posts to one in any three slots while richer items remain", () => {
    const items = [
      ...["a", "b", "c", "d"].map((id) => ({ idea: base({ id, sourceKind: "hackernews" }) })),
      ...["e", "f", "g", "h"].map((id) => ({ idea: base({ id, sourceKind: "editorial" }) })),
    ];
    const out = balanceSources(items).map((x) => x.idea.sourceKind);
    for (let i = 0; i + 2 < 6; i++) expect(out.slice(i, i + 3).filter((k) => k === "hackernews").length).toBeLessThanOrEqual(1);
    expect(out).toHaveLength(8);
  });

  it("seeded random is deterministic", () => {
    const a = seededRandom("x");
    const b = seededRandom("x");
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});
