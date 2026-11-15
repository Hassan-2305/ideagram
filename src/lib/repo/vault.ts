import "server-only";
import { db, newId, nowIso, parseJson } from "../db";
import { HttpError } from "../errors";
import { recordInteraction, rowToIdea, type IdeaRow } from "./ideas";
import type { Idea, VaultStatus } from "../types";

export interface VaultItem {
  idea: Idea;
  status: VaultStatus;
  notes: string;
  tags: string[];
  savedAt: string;
  updatedAt: string;
  collectionIds: string[];
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  count: number;
  createdAt: string;
}

export function saveIdea(userId: string, ideaId: string): boolean {
  const now = nowIso();
  const r = db()
    .prepare("INSERT OR IGNORE INTO vault_items (user_id, idea_id, status, created_at, updated_at) VALUES (?, ?, 'interesting', ?, ?)")
    .run(userId, ideaId, now, now);
  if (r.changes) {
    db().prepare("UPDATE ideas SET save_count = save_count + 1 WHERE id = ?").run(ideaId);
    recordInteraction(userId, ideaId, "save");
  }
  return r.changes > 0;
}

export function unsaveIdea(userId: string, ideaId: string) {
  const r = db().prepare("DELETE FROM vault_items WHERE user_id = ? AND idea_id = ?").run(userId, ideaId);
  if (r.changes) {
    db().prepare("UPDATE ideas SET save_count = MAX(0, save_count - 1) WHERE id = ?").run(ideaId);
    db()
      .prepare("DELETE FROM collection_items WHERE idea_id = ? AND collection_id IN (SELECT id FROM collections WHERE user_id = ?)")
      .run(ideaId, userId);
  }
}

export function updateVaultItem(userId: string, ideaId: string, patch: { status?: VaultStatus; notes?: string; tags?: string[] }) {
  const existing = db().prepare("SELECT 1 FROM vault_items WHERE user_id = ? AND idea_id = ?").get(userId, ideaId);
  if (!existing) throw new HttpError(404, "This idea is not in your vault.", "not_found");
  const sets: string[] = [];
  const vals: (string | null)[] = [];
  const add = (col: string, v: string) => {
    sets.push(`${col} = ?`);
    vals.push(v);
  };
  if (patch.status) add("status", patch.status);
  if (patch.notes !== undefined) add("notes", patch.notes);
  if (patch.tags) add("tags", JSON.stringify(patch.tags));
  if (!sets.length) return;
  sets.push("updated_at = ?");
  vals.push(nowIso());
  db()
    .prepare(`UPDATE vault_items SET ${sets.join(", ")} WHERE user_id = ? AND idea_id = ?`)
    .run(...vals, userId, ideaId);
}

export function listVault(userId: string, opts: { q?: string; status?: string; collectionId?: string; tag?: string } = {}): VaultItem[] {
  const where = ["v.user_id = :uid"];
  const params: Record<string, string> = { uid: userId };
  if (opts.status) {
    where.push("v.status = :status");
    params.status = opts.status;
  }
  if (opts.collectionId) {
    where.push("v.idea_id IN (SELECT ci.idea_id FROM collection_items ci JOIN collections c ON c.id = ci.collection_id WHERE c.id = :cid AND c.user_id = :uid)");
    params.cid = opts.collectionId;
  }
  if (opts.q) {
    where.push("(i.title LIKE :q OR i.summary LIKE :q OR v.notes LIKE :q OR v.tags LIKE :q OR i.stack LIKE :q)");
    params.q = `%${opts.q.replace(/[%_]/g, "")}%`;
  }
  if (opts.tag) {
    where.push("v.tags LIKE :tag");
    params.tag = `%"${opts.tag.replace(/["%_]/g, "")}"%`;
  }
  const rows = db()
    .prepare(
      `SELECT i.*, v.status AS v_status, v.notes AS v_notes, v.tags AS v_tags, v.created_at AS v_created, v.updated_at AS v_updated
       FROM vault_items v JOIN ideas i ON i.id = v.idea_id WHERE ${where.join(" AND ")} ORDER BY v.updated_at DESC`,
    )
    .all(params) as unknown as (IdeaRow & { v_status: string; v_notes: string; v_tags: string; v_created: string; v_updated: string })[];
  const memberships = db()
    .prepare("SELECT ci.idea_id, ci.collection_id FROM collection_items ci JOIN collections c ON c.id = ci.collection_id WHERE c.user_id = ?")
    .all(userId) as { idea_id: string; collection_id: string }[];
  const byIdea = new Map<string, string[]>();
  for (const m of memberships) byIdea.set(m.idea_id, [...(byIdea.get(m.idea_id) ?? []), m.collection_id]);
  return rows.map((r) => ({
    idea: rowToIdea(r),
    status: r.v_status as VaultStatus,
    notes: r.v_notes,
    tags: parseJson<string[]>(r.v_tags, []),
    savedAt: r.v_created,
    updatedAt: r.v_updated,
    collectionIds: byIdea.get(r.id) ?? [],
  }));
}

export function recentSaves(userId: string, limit = 4): Idea[] {
  const rows = db()
    .prepare("SELECT i.* FROM vault_items v JOIN ideas i ON i.id = v.idea_id WHERE v.user_id = ? ORDER BY v.created_at DESC LIMIT ?")
    .all(userId, limit) as unknown as IdeaRow[];
  return rows.map(rowToIdea);
}

// ---------- collections ----------

export function listCollections(userId: string): Collection[] {
  return (
    db()
      .prepare(
        `SELECT c.id, c.name, c.description, c.created_at, COUNT(ci.idea_id) AS n FROM collections c
         LEFT JOIN collection_items ci ON ci.collection_id = c.id WHERE c.user_id = ? GROUP BY c.id ORDER BY c.created_at`,
      )
      .all(userId) as { id: string; name: string; description: string; created_at: string; n: number }[]
  ).map((r) => ({ id: r.id, name: r.name, description: r.description, count: r.n, createdAt: r.created_at }));
}

export function createCollection(userId: string, name: string, description = ""): Collection {
  const id = newId("c_");
  const now = nowIso();
  db().prepare("INSERT INTO collections (id, user_id, name, description, created_at) VALUES (?, ?, ?, ?, ?)").run(id, userId, name, description, now);
  return { id, name, description, count: 0, createdAt: now };
}

function ownCollection(userId: string, id: string) {
  const row = db().prepare("SELECT id FROM collections WHERE id = ? AND user_id = ?").get(id, userId);
  if (!row) throw new HttpError(404, "Collection not found.", "not_found");
}

export function renameCollection(userId: string, id: string, name: string, description?: string) {
  ownCollection(userId, id);
  db().prepare("UPDATE collections SET name = ?, description = COALESCE(?, description) WHERE id = ?").run(name, description ?? null, id);
}

export function deleteCollection(userId: string, id: string) {
  ownCollection(userId, id);
  db().prepare("DELETE FROM collections WHERE id = ?").run(id);
}

export function setCollectionMembership(userId: string, collectionId: string, ideaId: string, member: boolean) {
  ownCollection(userId, collectionId);
  if (member) {
    const inVault = db().prepare("SELECT 1 FROM vault_items WHERE user_id = ? AND idea_id = ?").get(userId, ideaId);
    if (!inVault) throw new HttpError(400, "Save the idea to your vault first.", "not_saved");
    db().prepare("INSERT OR IGNORE INTO collection_items (collection_id, idea_id, added_at) VALUES (?, ?, ?)").run(collectionId, ideaId, nowIso());
  } else {
    db().prepare("DELETE FROM collection_items WHERE collection_id = ? AND idea_id = ?").run(collectionId, ideaId);
  }
}

export function vaultStats(userId: string): Record<string, number> {
  const rows = db().prepare("SELECT status, COUNT(*) AS n FROM vault_items WHERE user_id = ? GROUP BY status").all(userId) as {
    status: string;
    n: number;
  }[];
  return Object.fromEntries(rows.map((r) => [r.status, r.n]));
}

/** Markdown export of the vault (optionally one collection). */
export function exportMarkdown(userId: string, collectionId?: string): string {
  const items = listVault(userId, { collectionId });
  const title = collectionId ? listCollections(userId).find((c) => c.id === collectionId)?.name ?? "Collection" : "Idea Vault";
  const lines = [`# ${title}`, "", `_Exported from Idea Gym on ${new Date().toISOString().slice(0, 10)} · ${items.length} ideas_`, ""];
  for (const it of items) {
    const i = it.idea;
    lines.push(`## ${i.title}`, "", `**Status:** ${it.status} · **Category:** ${i.category} · **Difficulty:** ${i.difficulty}`, "");
    lines.push(i.summary, "");
    if (i.problem) lines.push(`**Problem.** ${i.problem}`, "");
    if (i.solution) lines.push(`**Solution.** ${i.solution}`, "");
    if (i.stack.length) lines.push(`**Stack:** ${i.stack.join(", ")}`, "");
    if (it.tags.length) lines.push(`**Tags:** ${it.tags.join(", ")}`, "");
    if (it.notes) lines.push("**Notes:**", "", it.notes, "");
    lines.push(`_Source: ${i.sourceName}${i.sourceUrl ? ` — ${i.sourceUrl}` : ""}_`, "");
  }
  return lines.join("\n");
}
