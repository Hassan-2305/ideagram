import { describe, expect, it } from "vitest";
import { EDITORIAL_IDEAS } from "@/data/editorial-ideas";
import { CHALLENGES } from "@/data/challenges";
import { dailyChallenge, KINDS, suggestNext } from "@/lib/challenges";
import { CATEGORY_SLUGS, DIFFICULTIES } from "@/lib/types";
import { GenerateSchema, HackathonSchema, RemixSchema, SignupSchema, SubmitSchema, UserIdeaSchema } from "@/lib/validation";
import { guessCategory, plainText } from "@/lib/ingest/heuristics";

describe("editorial content", () => {
  it("has unique slugs, valid categories and complete fields", () => {
    expect(new Set(EDITORIAL_IDEAS.map((i) => i.slug)).size).toBe(EDITORIAL_IDEAS.length);
    for (const i of EDITORIAL_IDEAS) {
      expect(CATEGORY_SLUGS).toContain(i.category);
      expect(DIFFICULTIES).toContain(i.difficulty);
      expect(i.title.length).toBeLessThanOrEqual(70);
      expect(i.problem.length).toBeGreaterThan(20);
      expect(i.mvp.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("covers every category", () => {
    for (const c of CATEGORY_SLUGS) expect(EDITORIAL_IDEAS.some((i) => i.category === c)).toBe(true);
  });

  it("slug-derived ids stay unique after truncation", () => {
    const ids = EDITORIAL_IDEAS.map((i) => "ed_" + i.slug.slice(0, 40));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("challenges", () => {
  it("are well formed and use valid categories (so answers can be saved as ideas)", () => {
    expect(new Set(CHALLENGES.map((c) => c.slug)).size).toBe(CHALLENGES.length);
    for (const c of CHALLENGES) {
      expect(KINDS).toContain(c.kind);
      expect(CATEGORY_SLUGS).toContain(c.category);
      expect(c.perspectives.length).toBeGreaterThanOrEqual(3);
      if (c.kind === "connect-the-dots") expect(c.conceptA && c.conceptB).toBeTruthy();
      if (c.kind === "reverse-engineer") expect(c.product).toBeTruthy();
    }
  });

  it("daily challenge is stable within a day and rotates kinds", () => {
    const d = new Date("2026-11-16T03:00:00Z");
    expect(dailyChallenge(d).slug).toBe(dailyChallenge(new Date("2026-11-16T22:00:00Z")).slug);
    expect(dailyChallenge(d).kind).not.toBe(dailyChallenge(new Date("2026-11-17T03:00:00Z")).kind);
  });

  it("suggests an uncompleted challenge from the least-practised kind", () => {
    const next = suggestNext([], { "problem-first": 5, "what-would-you-build": 5, "connect-the-dots": 5, constraint: 0, "reverse-engineer": 5 });
    expect(next?.kind).toBe("constraint");
  });
});

describe("validation", () => {
  it("rejects weak signups", () => {
    expect(SignupSchema.safeParse({ name: "A", email: "bad", password: "12345678" }).success).toBe(false);
    expect(SignupSchema.safeParse({ name: "A", email: "a@b.co", password: "short" }).success).toBe(false);
    expect(SignupSchema.safeParse({ name: "A", email: "A@B.co", password: "longenough" }).data?.email).toBe("a@b.co");
  });

  it("bounds AI inputs", () => {
    expect(GenerateSchema.safeParse({ style: "practical", count: 50 }).success).toBe(false);
    expect(GenerateSchema.safeParse({ style: "nope", count: 2 }).success).toBe(false);
    expect(RemixSchema.safeParse({ ideaIds: ["a"] }).success).toBe(false);
    expect(RemixSchema.safeParse({ ideaIds: ["a"], concepts: ["b"] }).success).toBe(true);
    expect(RemixSchema.safeParse({ concepts: ["a", "b", "c", "d", "e"] }).success).toBe(false);
    expect(HackathonSchema.safeParse({ theme: "x", hours: 24, teamSize: 3 }).success).toBe(false);
    expect(HackathonSchema.safeParse({ theme: "climate", hours: 24, teamSize: 3 }).success).toBe(true);
    expect(SubmitSchema.safeParse({ challengeSlug: "x", response: "too short" }).success).toBe(false);
    expect(UserIdeaSchema.safeParse({ title: "Hi", summary: "x", category: "ai-ml" }).success).toBe(false);
  });
});

describe("ingestion heuristics", () => {
  it("strips markup from source text", () => {
    expect(plainText("<p>Hello &amp; <a href='x'>world</a></p>")).toBe("Hello & world");
    expect(plainText("<script>alert(1)</script>ok")).toBe("alert(1)ok");
  });
  it("guesses categories", () => {
    expect(guessCategory("A tiny LLM agent for notes")).toBe("ai-ml");
    expect(guessCategory("ESP32 weather station")).toBe("hardware");
    expect(guessCategory("Something else entirely")).toBe("open-source");
  });
});
