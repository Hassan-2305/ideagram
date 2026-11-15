import "server-only";
import { db, nowIso } from "../db";
import { aiConfigured } from "../ai/client";
import { explainExternal } from "../ai/engines";
import { externalIdExists, insertIdea } from "../repo/ideas";
import { logError } from "../api";
import { guessCategory, guessStack, plainText } from "./heuristics";
import { githubSource } from "./github";
import { hackerNewsSource } from "./hackernews";
import type { CategorySlug, Difficulty, SourceKind } from "../types";

/**
 * Ingestion architecture: each source implements `Source.fetch()` returning
 * normalized RawItems from a public, documented API (no scraping). The
 * pipeline dedupes by external id, explains each item (Claude Haiku when
 * configured, otherwise the source's own text, labelled as such), and stores
 * it with full attribution. Add a source by implementing the interface and
 * registering it in SOURCES.
 */
export interface RawItem {
  externalId: string; // "<source>:<id>"
  title: string;
  text: string; // description / post body from the source
  url: string;
  creator: string | null;
  publishedAt: string | null;
  signals: { points?: number; stars?: number; language?: string | null; topics?: string[] };
}

export interface Source {
  id: SourceKind;
  name: string;
  minIntervalMinutes: number;
  fetch(): Promise<RawItem[]>;
}

export const SOURCES: Source[] = [hackerNewsSource, githubSource];

export function lastRun(source: string): { ranAt: string; added: number; error: string | null } | null {
  const r = db().prepare("SELECT ran_at, added, error FROM ingest_runs WHERE source = ? ORDER BY id DESC LIMIT 1").get(source) as
    | { ran_at: string; added: number; error: string | null }
    | undefined;
  return r ? { ranAt: r.ran_at, added: r.added, error: r.error } : null;
}

export function sourceStatus() {
  return SOURCES.map((s) => {
    const count = (db().prepare("SELECT COUNT(*) AS n FROM ideas WHERE source_kind = ?").get(s.id) as { n: number }).n;
    return { id: s.id, name: s.name, count, last: lastRun(s.id) };
  });
}

const running = new Set<string>();

export async function runSource(source: Source, { force = false, maxNew = 12 } = {}): Promise<{ added: number; skipped?: string }> {
  const last = lastRun(source.id);
  if (!force && last && Date.now() - new Date(last.ranAt).getTime() < source.minIntervalMinutes * 60_000) {
    return { added: 0, skipped: "recently-run" };
  }
  if (running.has(source.id)) return { added: 0, skipped: "in-progress" };
  running.add(source.id);
  let added = 0;
  try {
    const items = (await source.fetch()).filter((it) => !externalIdExists(it.externalId)).slice(0, maxNew);
    const useAI = aiConfigured();
    for (const it of items) {
      try {
        let summary = plainText(it.text).slice(0, 280) || it.title;
        let problem = "";
        let solution = "";
        let insight = "";
        let category: CategorySlug = guessCategory(`${it.title} ${it.text} ${(it.signals.topics ?? []).join(" ")}`);
        let difficulty: Difficulty = "intermediate";
        let buildTime = "";
        let stack = guessStack(it);
        let tags = (it.signals.topics ?? []).slice(0, 5);
        let aiExplained = false;
        if (useAI) {
          try {
            const e = await explainExternal({ title: it.title, text: it.text, url: it.url, source: source.name });
            if (!e.isIdea) continue; // skip news/hiring/opinion posts
            ({ summary, problem, solution, insight, category, difficulty, buildTime } = e);
            stack = e.stack.slice(0, 6);
            tags = e.tags.slice(0, 5).map((t) => t.toLowerCase());
            aiExplained = true;
          } catch (err) {
            logError(`ingest:${source.id}:explain`, err);
          }
        }
        insertIdea({
          externalId: it.externalId,
          title: it.title.replace(/^Show HN:\s*/i, "").slice(0, 120),
          summary,
          problem,
          solution,
          insight,
          category,
          difficulty,
          buildTime,
          stack,
          tags,
          sourceKind: source.id,
          sourceName: source.name,
          sourceUrl: it.url,
          creator: it.creator,
          publishedAt: it.publishedAt,
          isPublic: true,
          details: { implementation: aiExplained ? "ai-explained" : "source-text" },
          quality: Math.min(0.75, 0.45 + Math.log10(1 + (it.signals.points ?? it.signals.stars ?? 0)) / 10),
        });
        added++;
      } catch (err) {
        logError(`ingest:${source.id}:item`, err);
      }
    }
    db().prepare("INSERT INTO ingest_runs (source, ran_at, added, error) VALUES (?, ?, ?, NULL)").run(source.id, nowIso(), added);
    return { added };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    db().prepare("INSERT INTO ingest_runs (source, ran_at, added, error) VALUES (?, ?, ?, ?)").run(source.id, nowIso(), added, msg.slice(0, 500));
    logError(`ingest:${source.id}`, err);
    return { added, skipped: "error" };
  } finally {
    running.delete(source.id);
  }
}

/** Fire-and-forget refresh used by page loads; respects per-source intervals. */
export function refreshInBackground() {
  if (process.env.INGEST_DISABLED === "1") return;
  for (const s of SOURCES) void runSource(s).catch((e) => logError("ingest:bg", e));
}
