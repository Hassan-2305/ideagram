import "server-only";
import { db, newId, nowIso, parseJson } from "../db";
import type { CategorySlug, Difficulty, Idea, IdeaDetails, InteractionKind, SourceKind } from "../types";

export interface IdeaRow {
  id: string;
  title: string;
  summary: string;
  problem: string;
  solution: string;
  insight: string;
  category: string;
  difficulty: string;
  build_time: string;
  stack: string;
  tags: string;
  source_kind: string;
  source_name: string;
  source_url: string | null;
  creator: string | null;
  published_at: string | null;
  created_at: string;
  owner_id: string | null;
  is_public: number;
  details: string | null;
  parent_ids: string;
  like_count: number;
  save_count: number;
  quality: number;
}

export function rowToIdea(r: IdeaRow): Idea {
  return {
    id: r.id,
    title: r.title,
    summary: r.summary,
    problem: r.problem,
    solution: r.solution,
    insight: r.insight,
    category: r.category as CategorySlug,
    difficulty: r.difficulty as Difficulty,
    buildTime: r.build_time,
    stack: parseJson<string[]>(r.stack, []),
    tags: parseJson<string[]>(r.tags, []),
    sourceKind: r.source_kind as SourceKind,
    sourceName: r.source_name,
    sourceUrl: r.source_url,
    creator: r.creator,
    publishedAt: r.published_at,
    createdAt: r.created_at,
    ownerId: r.owner_id,
    isPublic: r.is_public === 1,
    details: parseJson<IdeaDetails | null>(r.details, null),
    parentIds: parseJson<string[]>(r.parent_ids, []),
    likeCount: r.like_count,
    saveCount: r.save_count,
  };
}

/** SQL predicate: rows the given user may read. */
export const VISIBLE = "(i.is_public = 1 OR i.owner_id = :uid)";

export function getIdea(id: string, userId: string | null): Idea | null {
  const row = db()
    .prepare(`SELECT i.* FROM ideas i WHERE i.id = :id AND ${VISIBLE}`)
    .get({ id, uid: userId ?? "" }) as IdeaRow | undefined;
  return row ? rowToIdea(row) : null;
}

export function getIdeas(ids: string[], userId: string | null): Idea[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map((_, i) => `:id${i}`).join(",");
  const params: Record<string, string> = { uid: userId ?? "" };
  ids.forEach((id, i) => (params[`id${i}`] = id));
  const rows = db()
    .prepare(`SELECT i.* FROM ideas i WHERE i.id IN (${placeholders}) AND ${VISIBLE}`)
    .all(params) as unknown as IdeaRow[];
  const byId = new Map(rows.map((r) => [r.id, rowToIdea(r)]));
  return ids.map((id) => byId.get(id)).filter((x): x is Idea => !!x);
}

export interface NewIdea {
  title: string;
  summary: string;
  problem: string;
  solution: string;
  insight: string;
  category: CategorySlug;
  difficulty: Difficulty;
  buildTime: string;
  stack: string[];
  tags: string[];
  sourceKind: SourceKind;
  sourceName: string;
  sourceUrl?: string | null;
  creator?: string | null;
  publishedAt?: string | null;
  ownerId?: string | null;
  isPublic?: boolean;
  details?: IdeaDetails | null;
  parentIds?: string[];
  externalId?: string | null;
  quality?: number;
}

export function insertIdea(input: NewIdea): Idea {
  const id = newId("i_");
  const now = nowIso();
  db()
    .prepare(
      `INSERT INTO ideas (id, external_id, title, summary, problem, solution, insight, category, difficulty, build_time,
        stack, tags, source_kind, source_name, source_url, creator, published_at, created_at, owner_id, is_public,
        details, parent_ids, quality)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.externalId ?? null,
      input.title,
      input.summary,
      input.problem,
      input.solution,
      input.insight,
      input.category,
      input.difficulty,
      input.buildTime,
      JSON.stringify(input.stack),
      JSON.stringify(input.tags),
      input.sourceKind,
      input.sourceName,
      input.sourceUrl ?? null,
      input.creator ?? null,
      input.publishedAt ?? null,
      now,
      input.ownerId ?? null,
      input.isPublic === false ? 0 : 1,
      input.details ? JSON.stringify(input.details) : null,
      JSON.stringify(input.parentIds ?? []),
      input.quality ?? 0.5,
    );
  return getIdea(id, input.ownerId ?? null)!;
}

/** Private AI ideas this user generated from `parentId` in the last `hours`. */
export function recentChildren(userId: string, parentId: string, hours: number): Idea[] {
  const since = new Date(Date.now() - hours * 3_600_000).toISOString();
  const rows = db()
    .prepare(
      `SELECT i.* FROM ideas i, json_each(i.parent_ids) p
       WHERE i.owner_id = ? AND i.source_kind = 'ai' AND p.value = ? AND i.created_at > ? ORDER BY i.created_at DESC LIMIT 6`,
    )
    .all(userId, parentId, since) as unknown as IdeaRow[];
  return rows.map(rowToIdea);
}

export function externalIdExists(externalId: string): boolean {
  return !!db().prepare("SELECT 1 FROM ideas WHERE external_id = ?").get(externalId);
}

// ---------- per-user state ----------

export interface IdeaUserState {
  liked: boolean;
  saved: boolean;
  hidden: boolean;
  interesting: boolean;
}

export function userStates(userId: string | null, ideaIds: string[]): Record<string, IdeaUserState> {
  const out: Record<string, IdeaUserState> = {};
  for (const id of ideaIds) out[id] = { liked: false, saved: false, hidden: false, interesting: false };
  if (!userId || ideaIds.length === 0) return out;
  const ph = ideaIds.map(() => "?").join(",");
  const d = db();
  for (const r of d.prepare(`SELECT idea_id FROM likes WHERE user_id = ? AND idea_id IN (${ph})`).all(userId, ...ideaIds) as { idea_id: string }[])
    out[r.idea_id].liked = true;
  for (const r of d.prepare(`SELECT idea_id FROM vault_items WHERE user_id = ? AND idea_id IN (${ph})`).all(userId, ...ideaIds) as { idea_id: string }[])
    out[r.idea_id].saved = true;
  for (const r of d.prepare(`SELECT idea_id FROM hidden_ideas WHERE user_id = ? AND idea_id IN (${ph})`).all(userId, ...ideaIds) as { idea_id: string }[])
    out[r.idea_id].hidden = true;
  for (const r of d
    .prepare(`SELECT DISTINCT idea_id FROM interactions WHERE user_id = ? AND kind = 'interesting' AND idea_id IN (${ph})`)
    .all(userId, ...ideaIds) as { idea_id: string }[])
    out[r.idea_id].interesting = true;
  return out;
}

export function recordInteraction(userId: string, ideaId: string, kind: InteractionKind) {
  db().prepare("INSERT INTO interactions (user_id, idea_id, kind, created_at) VALUES (?, ?, ?, ?)").run(userId, ideaId, kind, nowIso());
}

export function setLike(userId: string, ideaId: string, on: boolean): number {
  const d = db();
  if (on) {
    const r = d.prepare("INSERT OR IGNORE INTO likes (user_id, idea_id, created_at) VALUES (?, ?, ?)").run(userId, ideaId, nowIso());
    if (r.changes) {
      d.prepare("UPDATE ideas SET like_count = like_count + 1 WHERE id = ?").run(ideaId);
      recordInteraction(userId, ideaId, "like");
    }
  } else {
    const r = d.prepare("DELETE FROM likes WHERE user_id = ? AND idea_id = ?").run(userId, ideaId);
    if (r.changes) d.prepare("UPDATE ideas SET like_count = MAX(0, like_count - 1) WHERE id = ?").run(ideaId);
  }
  return (d.prepare("SELECT like_count FROM ideas WHERE id = ?").get(ideaId) as { like_count: number }).like_count;
}

export function setHidden(userId: string, ideaId: string, on: boolean) {
  if (on) {
    db().prepare("INSERT OR IGNORE INTO hidden_ideas (user_id, idea_id, created_at) VALUES (?, ?, ?)").run(userId, ideaId, nowIso());
    recordInteraction(userId, ideaId, "hide");
  } else {
    db().prepare("DELETE FROM hidden_ideas WHERE user_id = ? AND idea_id = ?").run(userId, ideaId);
  }
}

export function reportIdea(userId: string, ideaId: string, reason: string, note: string | null) {
  db()
    .prepare("INSERT INTO reports (id, user_id, idea_id, reason, note, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(newId("r_"), userId, ideaId, reason, note, nowIso());
}

// ---------- search ----------

/** Turns free text into a safe FTS5 prefix query: "local ai" -> "local"* "ai"* */
export function toFtsQuery(q: string): string | null {
  const terms = q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .slice(0, 8);
  if (terms.length === 0) return null;
  return terms.map((t) => `"${t}"*`).join(" ");
}

export function searchIdeas(q: string, userId: string | null, limit = 20): Idea[] {
  const fts = toFtsQuery(q);
  if (!fts) return [];
  const rows = db()
    .prepare(
      `SELECT i.* FROM ideas_fts f JOIN ideas i ON i.rowid = f.rowid
       WHERE ideas_fts MATCH :q AND ${VISIBLE}
       ORDER BY bm25(ideas_fts, 6.0, 3.0, 2.0, 1.5, 2.0, 2.0) LIMIT :limit`,
    )
    .all({ q: fts, uid: userId ?? "", limit }) as unknown as IdeaRow[];
  return rows.map(rowToIdea);
}

/** Related ideas: lexical similarity on title/tags/stack, same-category boost. */
export function relatedIdeas(idea: Idea, userId: string | null, limit = 4): Idea[] {
  const seed = [idea.title, ...idea.tags, ...idea.stack.slice(0, 3)].join(" ");
  const fts = toFtsQuery(seed)?.split(" ").join(" OR ");
  if (!fts) return [];
  const rows = db()
    .prepare(
      `SELECT i.*, bm25(ideas_fts) AS score FROM ideas_fts f JOIN ideas i ON i.rowid = f.rowid
       WHERE ideas_fts MATCH :q AND i.id != :id AND ${VISIBLE}
       ORDER BY (CASE WHEN i.category = :cat THEN -2.0 ELSE 0 END) + bm25(ideas_fts) LIMIT :limit`,
    )
    .all({ q: fts, id: idea.id, uid: userId ?? "", cat: idea.category, limit }) as unknown as IdeaRow[];
  return rows.map(rowToIdea);
}
