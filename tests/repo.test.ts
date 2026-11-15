import { beforeEach, describe, expect, it } from "vitest";
import { __setDb, openDatabase, db, newId, nowIso } from "@/lib/db";
import { getIdea, insertIdea, searchIdeas, setHidden, setLike, toFtsQuery, userStates } from "@/lib/repo/ideas";
import { getFeed } from "@/lib/repo/feed";
import { createCollection, exportMarkdown, listVault, saveIdea, setCollectionMembership, unsaveIdea, updateVaultItem } from "@/lib/repo/vault";
import {
  addTask,
  computeStreak,
  createHackathonSession,
  createProject,
  getProject,
  lineage,
  setShortlist,
  updateTask,
} from "@/lib/repo/workspace";
import { EDITORIAL_IDEAS } from "@/data/editorial-ideas";
import type { ProjectPlan } from "@/lib/ai/schemas";

function user(name: string) {
  const id = newId("u_");
  db().prepare("INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, 'x', ?)").run(id, `${id}@t.dev`, name, nowIso());
  db().prepare("INSERT INTO preferences (user_id, updated_at) VALUES (?, ?)").run(id, nowIso());
  return id;
}

const privateIdea = (ownerId: string, title = "Secret plan") =>
  insertIdea({
    title,
    summary: "private summary",
    problem: "p",
    solution: "s",
    insight: "",
    category: "ai-ml",
    difficulty: "beginner",
    buildTime: "1 weekend",
    stack: ["SQLite"],
    tags: ["mine"],
    sourceKind: "ai",
    sourceName: "AI Lab",
    ownerId,
    isPublic: false,
  });

const plan: ProjectPlan = {
  title: "P",
  pitch: "pitch",
  requirements: [{ id: "R1", text: "x", priority: "must" }],
  mvpFeatures: ["a"],
  architecture: "arch",
  dataModel: [],
  api: [],
  stack: [],
  milestones: [
    { name: "M1", goal: "g", duration: "1d", tasks: ["t1", "t2"] },
    { name: "M2", goal: "g", duration: "1d", tasks: ["t3"] },
  ],
  testing: [],
  deployment: [],
  risks: [],
};

let alice: string;
let bob: string;

beforeEach(() => {
  __setDb(openDatabase(":memory:"));
  alice = user("Alice");
  bob = user("Bob");
});

describe("seed + migrations", () => {
  it("seeds every editorial idea exactly once and is idempotent", () => {
    const n = (db().prepare("SELECT COUNT(*) AS n FROM ideas WHERE source_kind='editorial'").get() as { n: number }).n;
    expect(n).toBe(EDITORIAL_IDEAS.length);
  });
});

describe("authorization", () => {
  it("private ideas are only visible to their owner", () => {
    const idea = privateIdea(alice);
    expect(getIdea(idea.id, alice)).not.toBeNull();
    expect(getIdea(idea.id, bob)).toBeNull();
    expect(getIdea(idea.id, null)).toBeNull();
    expect(searchIdeas("secret", bob).map((i) => i.id)).not.toContain(idea.id);
    expect(searchIdeas("secret", alice).map((i) => i.id)).toContain(idea.id);
  });

  it("private ideas never appear in the public feed", () => {
    privateIdea(alice);
    const ids = getFeed({ userId: bob, limit: 40 }).items.map((i) => i.idea.title);
    expect(ids).not.toContain("Secret plan");
    expect(getFeed({ userId: alice, source: "mine" }).items.map((i) => i.idea.title)).toEqual(["Secret plan"]);
  });

  it("users cannot add ideas to someone else's collection", () => {
    const c = createCollection(alice, "Mine");
    const idea = EDITORIAL_IDEAS[0];
    saveIdea(bob, "ed_" + idea.slug.slice(0, 40));
    expect(() => setCollectionMembership(bob, c.id, "ed_" + idea.slug.slice(0, 40), true)).toThrow(/not found/i);
  });

  it("users cannot read someone else's project", () => {
    const p = createProject(alice, null, plan);
    expect(getProject(bob, p.id)).toBeNull();
    expect(() => addTask(bob, p.id, "M1", "hack")).toThrow(/not found/i);
  });
});

describe("vault", () => {
  it("save/unsave keeps save_count consistent and status/notes/tags update", () => {
    const id = getFeed({ userId: alice, source: "editorial", limit: 1 }).items[0].idea.id;
    saveIdea(alice, id);
    saveIdea(alice, id); // idempotent
    expect(getIdea(id, alice)!.saveCount).toBe(1);
    updateVaultItem(alice, id, { status: "exploring", notes: "hello", tags: ["weekend"] });
    const [item] = listVault(alice);
    expect(item.status).toBe("exploring");
    expect(item.notes).toBe("hello");
    expect(listVault(alice, { tag: "weekend" })).toHaveLength(1);
    expect(exportMarkdown(alice)).toContain("hello");
    unsaveIdea(alice, id);
    expect(getIdea(id, alice)!.saveCount).toBe(0);
    expect(userStates(alice, [id])[id].saved).toBe(false);
  });

  it("collections require the idea to be saved first", () => {
    const c = createCollection(alice, "Hack");
    const id = getFeed({ userId: alice, source: "editorial", limit: 1 }).items[0].idea.id;
    expect(() => setCollectionMembership(alice, c.id, id, true)).toThrow(/vault first/);
    saveIdea(alice, id);
    setCollectionMembership(alice, c.id, id, true);
    expect(listVault(alice, { collectionId: c.id })).toHaveLength(1);
  });
});

describe("feed", () => {
  it("hidden ideas are excluded and likes are counted once", () => {
    const first = getFeed({ userId: alice, sort: "newest", limit: 1 }).items[0].idea.id;
    setHidden(alice, first, true);
    expect(getFeed({ userId: alice, sort: "newest", limit: 40 }).items.map((i) => i.idea.id)).not.toContain(first);
    const other = getFeed({ userId: alice, sort: "newest", limit: 1 }).items[0].idea.id;
    expect(setLike(alice, other, true)).toBe(1);
    expect(setLike(alice, other, true)).toBe(1);
    expect(setLike(alice, other, false)).toBe(0);
  });

  it("paginates without duplicates", () => {
    const p1 = getFeed({ userId: alice, limit: 10 });
    const p2 = getFeed({ userId: alice, limit: 10, cursor: p1.nextCursor! });
    const ids = [...p1.items, ...p2.items].map((i) => i.idea.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("filters by category and difficulty", () => {
    const page = getFeed({ userId: null, category: "hardware", difficulty: "advanced", sort: "newest" });
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((i) => i.idea.category === "hardware" && i.idea.difficulty === "advanced")).toBe(true);
  });
});

describe("search", () => {
  it("sanitises FTS syntax", () => {
    expect(toFtsQuery('foo" OR bar*) NEAR(')).toBe('"foo"* "or"* "bar"* "near"*');
    expect(toFtsQuery("  ")).toBeNull();
    expect(() => searchIdeas('") DROP TABLE ideas; --', null)).not.toThrow();
  });
});

describe("projects & hackathon", () => {
  it("tracks task progress and moves planned → building on first check", () => {
    const p = createProject(alice, null, plan);
    expect(p.tasks).toHaveLength(3);
    updateTask(alice, p.id, p.tasks[0].id, { done: true });
    const after = getProject(alice, p.id)!;
    expect(after.status).toBe("building");
    expect(after.progress).toBeCloseTo(1 / 3);
  });

  it("shortlist ignores out-of-range indices", () => {
    const s = createHackathonSession(alice, "t", {}, [{} as never, {} as never]);
    expect(setShortlist(alice, s.id, [0, 1, 5, -1, 1])).toEqual([0, 1]);
  });

  it("builds remix lineage", () => {
    const a = privateIdea(alice, "A");
    const b = insertIdea({ ...privateIdea(alice, "B"), parentIds: [a.id], sourceKind: "remix", sourceName: "Remix", ownerId: alice, isPublic: false });
    expect(lineage(b.id, alice)!.parents[0].idea.id).toBe(a.id);
    expect(lineage(b.id, bob)).toBeNull();
  });
});

describe("streaks", () => {
  it("counts consecutive days and keeps today's streak alive", () => {
    expect(computeStreak(["2026-11-14", "2026-11-15"], "2026-11-16")).toEqual({ current: 2, best: 2 });
    expect(computeStreak(["2026-11-14", "2026-11-15", "2026-11-16"], "2026-11-16").current).toBe(3);
    expect(computeStreak(["2026-11-10", "2026-11-11", "2026-11-12", "2026-11-15"], "2026-11-16")).toEqual({ current: 1, best: 3 });
    expect(computeStreak([], "2026-11-16")).toEqual({ current: 0, best: 0 });
  });
});

describe("similar-idea reuse", () => {
  it("finds recent AI children of a seed for the same user only", async () => {
    const { recentChildren } = await import("@/lib/repo/ideas");
    const seed = privateIdea(alice, "Seed");
    const child = insertIdea({ ...privateIdea(alice, "Child"), parentIds: [seed.id], ownerId: alice, isPublic: false });
    expect(recentChildren(alice, seed.id, 6).map((i) => i.id)).toEqual([child.id]);
    expect(recentChildren(bob, seed.id, 6)).toHaveLength(0);
  });
});
