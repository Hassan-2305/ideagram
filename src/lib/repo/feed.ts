import "server-only";
import { db, parseJson } from "../db";
import { balanceSources, rankFeed, scoreIdeas, type ScoredIdea, type UserSignals } from "../recommend";
import { rowToIdea, toFtsQuery, VISIBLE, type IdeaRow } from "./ideas";
import type { Idea } from "../types";

export type FeedSort = "for-you" | "newest" | "popular" | "quick";

export interface FeedQuery {
  userId: string | null;
  category?: string | null;
  q?: string | null;
  sort?: FeedSort;
  source?: string | null; // "editorial" | "hackernews" | "github" | "community" | "mine"
  difficulty?: string | null;
  cursor?: number; // offset
  limit?: number;
}

export interface FeedItem {
  idea: Idea;
  reason?: ScoredIdea["reason"];
}

export interface FeedPage {
  items: FeedItem[];
  nextCursor: number | null;
  total: number;
}

export function getSignals(userId: string | null): UserSignals {
  const empty: UserSignals = {
    preferredCategories: [],
    technologies: [],
    difficulty: null,
    exploration: 0.25,
    categoryActions: [],
    savedIds: new Set(),
    personalization: true,
  };
  if (!userId) return empty;
  const d = db();
  const p = d.prepare("SELECT * FROM preferences WHERE user_id = ?").get(userId) as
    | { categories: string; technologies: string; difficulty: string | null; exploration: number; personalization: number }
    | undefined;
  const actions = d
    .prepare(
      `SELECT i.category AS category, x.kind AS kind, COUNT(*) AS n FROM interactions x JOIN ideas i ON i.id = x.idea_id
       WHERE x.user_id = ? AND x.created_at > ? GROUP BY i.category, x.kind`,
    )
    .all(userId, new Date(Date.now() - 90 * 86_400_000).toISOString()) as { category: string; kind: string; n: number }[];
  const saved = d.prepare("SELECT idea_id FROM vault_items WHERE user_id = ?").all(userId) as { idea_id: string }[];
  return {
    preferredCategories: parseJson<string[]>(p?.categories, []),
    technologies: parseJson<string[]>(p?.technologies, []),
    difficulty: p?.difficulty ?? null,
    exploration: p?.exploration ?? 0.25,
    categoryActions: actions,
    savedIds: new Set(saved.map((s) => s.idea_id)),
    personalization: (p?.personalization ?? 1) === 1,
  };
}

function whereClause(q: FeedQuery) {
  const where = [VISIBLE, "i.id NOT IN (SELECT idea_id FROM hidden_ideas WHERE user_id = :uid)"];
  const params: Record<string, string | number> = { uid: q.userId ?? "" };
  // The public feed shows editorial + externally sourced + public ideas. Private AI/remix
  // ideas only appear under source=mine.
  if (q.source === "mine") where.push("i.owner_id = :uid");
  else where.push("i.is_public = 1");
  if (q.source && q.source !== "mine") {
    if (q.source === "community") where.push("i.source_kind IN ('hackernews','github')");
    else {
      where.push("i.source_kind = :src");
      params.src = q.source;
    }
  }
  if (q.category) {
    where.push("i.category = :cat");
    params.cat = q.category;
  }
  if (q.difficulty) {
    where.push("i.difficulty = :diff");
    params.diff = q.difficulty;
  }
  let join = "";
  const fts = q.q ? toFtsQuery(q.q) : null;
  if (q.q && !fts) where.push("0"); // query had no searchable terms
  if (fts) {
    join = "JOIN ideas_fts f ON f.rowid = i.rowid";
    where.push("ideas_fts MATCH :fts");
    params.fts = fts;
  }
  return { sql: `FROM ideas i ${join} WHERE ${where.join(" AND ")}`, params, hasFts: !!fts };
}

const QUICK_ORDER = `CASE
  WHEN i.build_time LIKE '%hour%' THEN 0
  WHEN i.build_time LIKE '%day%' OR i.build_time LIKE '%weekend%' THEN 1
  WHEN i.build_time LIKE '%week%' THEN 2 ELSE 3 END`;

export function getFeed(q: FeedQuery): FeedPage {
  const limit = Math.min(Math.max(q.limit ?? 12, 1), 40);
  const offset = Math.max(q.cursor ?? 0, 0);
  const sort: FeedSort = q.sort ?? "for-you";
  const { sql, params, hasFts } = whereClause(q);
  const d = db();
  const total = (d.prepare(`SELECT COUNT(*) AS n ${sql}`).get(params) as { n: number }).n;

  if (sort === "for-you" && !hasFts) {
    // Score a bounded candidate pool, then page through the ranked list.
    const rows = d
      .prepare(`SELECT i.* ${sql} ORDER BY i.created_at DESC LIMIT 400`)
      .all(params) as unknown as IdeaRow[];
    const signals = getSignals(q.userId);
    const day = new Date().toISOString().slice(0, 10);
    const seed = `${q.userId ?? "anon"}:${day}`;
    const ideas = rows.map((r) => ({ ...rowToIdea(r), quality: r.quality }));
    const ranked = q.source ? rankFeed(scoreIdeas(ideas, signals, seed), signals, ideas.length, seed) : balanceSources(rankFeed(scoreIdeas(ideas, signals, seed), signals, ideas.length, seed));
    const slice = ranked.slice(offset, offset + limit);
    return {
      items: slice.map((s) => ({ idea: stripQuality(s.idea), reason: s.reason })),
      nextCursor: offset + limit < ranked.length ? offset + limit : null,
      total: ranked.length,
    };
  }

  const order =
    sort === "popular"
      ? "(i.like_count + 2 * i.save_count) DESC, i.created_at DESC"
      : sort === "quick"
        ? `${QUICK_ORDER}, i.quality DESC`
        : hasFts && sort === "for-you"
          ? "bm25(ideas_fts, 6.0, 3.0, 2.0, 1.5, 2.0, 2.0)"
          : "COALESCE(i.published_at, i.created_at) DESC";
  const rows = d
    .prepare(`SELECT i.* ${sql} ORDER BY ${order} LIMIT :limit OFFSET :offset`)
    .all({ ...params, limit, offset }) as unknown as IdeaRow[];
  return {
    items: rows.map((r) => ({ idea: rowToIdea(r) })),
    nextCursor: offset + limit < total ? offset + limit : null,
    total,
  };
}

function stripQuality(i: Idea & { quality?: number }): Idea {
  const { quality: _q, ...rest } = i;
  void _q;
  return rest;
}

/** Deterministic "idea of the day" from the public editorial pool. */
export function featuredIdea(userId: string | null): Idea | null {
  const rows = db()
    .prepare("SELECT i.* FROM ideas i WHERE i.is_public = 1 AND i.source_kind = 'editorial' ORDER BY i.id")
    .all() as unknown as IdeaRow[];
  if (!rows.length) return null;
  const day = Math.floor(Date.now() / 86_400_000);
  void userId;
  return rowToIdea(rows[day % rows.length]);
}

export function categoryCounts(): Record<string, number> {
  const rows = db().prepare("SELECT category, COUNT(*) AS n FROM ideas WHERE is_public = 1 GROUP BY category").all() as {
    category: string;
    n: number;
  }[];
  return Object.fromEntries(rows.map((r) => [r.category, r.n]));
}
