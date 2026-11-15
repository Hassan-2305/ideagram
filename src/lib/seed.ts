import type { DatabaseSync } from "node:sqlite";
import { EDITORIAL_IDEAS } from "@/data/editorial-ideas";

/**
 * Seeds the editorial idea library (written by the Idea Gym team and shipped
 * with the app). These are labelled "Idea Gym Editorial" in the UI — they are
 * never presented as community submissions or external content.
 * Idempotent: keyed on external_id = "editorial:<slug>".
 */
export function seedIfEmpty(db: DatabaseSync) {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO ideas (
      id, external_id, title, summary, problem, solution, insight, category, difficulty,
      build_time, stack, tags, source_kind, source_name, source_url, creator, published_at,
      created_at, owner_id, is_public, details, parent_ids, quality
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'editorial', 'Idea Gym Editorial', NULL, 'Idea Gym Editorial', ?, ?, NULL, 1, ?, '[]', 0.8)
  `);
  const existing = db.prepare("SELECT COUNT(*) AS n FROM ideas WHERE source_kind = 'editorial'").get() as { n: number };
  if (existing.n >= EDITORIAL_IDEAS.length) return;

  // Stagger timestamps so "newest" sorting is stable and meaningful.
  const base = Date.UTC(2026, 9, 1);
  db.exec("BEGIN");
  try {
    EDITORIAL_IDEAS.forEach((idea, i) => {
      const ts = new Date(base + i * 3_600_000 * 7).toISOString();
      insert.run(
        "ed_" + idea.slug.slice(0, 40),
        "editorial:" + idea.slug,
        idea.title,
        idea.summary,
        idea.problem,
        idea.solution,
        idea.insight,
        idea.category,
        idea.difficulty,
        idea.buildTime,
        JSON.stringify(idea.stack),
        JSON.stringify(idea.tags),
        ts,
        ts,
        JSON.stringify({
          audience: idea.audience,
          alternatives: idea.alternatives,
          mvp: idea.mvp,
          challenges: idea.challenges,
        }),
      );
    });
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
