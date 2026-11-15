import "server-only";
import { db, newId, nowIso, parseJson } from "../db";
import { HttpError } from "../errors";
import { getIdeas, rowToIdea, type IdeaRow } from "./ideas";
import type { Idea } from "../types";
import type { ChallengeFeedback, HackathonIdea, ProjectPlan } from "../ai/schemas";

// ============================ Remix history ============================

export interface RemixRecord {
  id: string;
  inputs: Idea[];
  instruction: string;
  result: Idea;
  createdAt: string;
}

export function recordRemix(userId: string, inputIds: string[], instruction: string, resultId: string) {
  db()
    .prepare("INSERT INTO remixes (id, user_id, input_ids, instruction, result_idea_id, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(newId("x_"), userId, JSON.stringify(inputIds), instruction, resultId, nowIso());
}

export function listRemixes(userId: string, limit = 30): RemixRecord[] {
  const rows = db()
    .prepare("SELECT * FROM remixes WHERE user_id = ? ORDER BY created_at DESC LIMIT ?")
    .all(userId, limit) as { id: string; input_ids: string; instruction: string; result_idea_id: string; created_at: string }[];
  return rows
    .map((r) => {
      const inputs = getIdeas(parseJson<string[]>(r.input_ids, []), userId);
      const [result] = getIdeas([r.result_idea_id], userId);
      return result ? { id: r.id, inputs, instruction: r.instruction, result, createdAt: r.created_at } : null;
    })
    .filter((x): x is RemixRecord => !!x);
}

/** Walks parent links to build the lineage tree of a remixed idea (Idea Evolution). */
export interface LineageNode {
  idea: Idea;
  parents: LineageNode[];
}

export function lineage(ideaId: string, userId: string, depth = 4): LineageNode | null {
  const [idea] = getIdeas([ideaId], userId);
  if (!idea) return null;
  if (depth <= 0) return { idea, parents: [] };
  return {
    idea,
    parents: idea.parentIds.map((p) => lineage(p, userId, depth - 1)).filter((x): x is LineageNode => !!x),
  };
}

// ============================ Thinking Gym ============================

export interface Submission {
  id: string;
  challengeSlug: string;
  kind: string;
  category: string;
  response: string;
  feedback: ChallengeFeedback | null;
  day: string;
  createdAt: string;
}

export function utcDay(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function addSubmission(userId: string, s: { challengeSlug: string; kind: string; category: string; response: string }): Submission {
  const id = newId("s_");
  const createdAt = nowIso();
  const day = utcDay();
  db()
    .prepare(
      "INSERT INTO challenge_submissions (id, user_id, challenge_slug, kind, category, response, feedback, day, created_at) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)",
    )
    .run(id, userId, s.challengeSlug, s.kind, s.category, s.response, day, createdAt);
  return { id, ...s, feedback: null, day, createdAt };
}

export function setSubmissionFeedback(userId: string, id: string, fb: ChallengeFeedback) {
  const r = db().prepare("UPDATE challenge_submissions SET feedback = ? WHERE id = ? AND user_id = ?").run(JSON.stringify(fb), id, userId);
  if (!r.changes) throw new HttpError(404, "Submission not found.", "not_found");
}

export function getSubmission(userId: string, id: string): Submission | null {
  const r = db().prepare("SELECT * FROM challenge_submissions WHERE id = ? AND user_id = ?").get(id, userId) as SubRow | undefined;
  return r ? mapSub(r) : null;
}

type SubRow = { id: string; challenge_slug: string; kind: string; category: string; response: string; feedback: string | null; day: string; created_at: string };
const mapSub = (r: SubRow): Submission => ({
  id: r.id,
  challengeSlug: r.challenge_slug,
  kind: r.kind,
  category: r.category,
  response: r.response,
  feedback: parseJson<ChallengeFeedback | null>(r.feedback, null),
  day: r.day,
  createdAt: r.created_at,
});

export function listSubmissions(userId: string, limit = 50): Submission[] {
  return (db().prepare("SELECT * FROM challenge_submissions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?").all(userId, limit) as SubRow[]).map(mapSub);
}

/** Pure streak computation over distinct UTC days (exported for tests). */
export function computeStreak(days: string[], today: string): { current: number; best: number } {
  const set = new Set(days);
  const prev = (d: string) => utcDay(new Date(new Date(d + "T00:00:00Z").getTime() - 86_400_000));
  let current = 0;
  // A streak stays alive through today even if today's exercise isn't done yet.
  let cursor = set.has(today) ? today : prev(today);
  while (set.has(cursor)) {
    current++;
    cursor = prev(cursor);
  }
  const sorted = [...set].sort();
  let best = 0;
  let run = 0;
  let last: string | null = null;
  for (const d of sorted) {
    run = last && prev(d) === last ? run + 1 : 1;
    best = Math.max(best, run);
    last = d;
  }
  return { current, best };
}

export function gymStats(userId: string) {
  const d = db();
  const days = (d.prepare("SELECT DISTINCT day FROM challenge_submissions WHERE user_id = ?").all(userId) as { day: string }[]).map((r) => r.day);
  const byKind = d.prepare("SELECT kind, COUNT(*) AS n FROM challenge_submissions WHERE user_id = ? GROUP BY kind").all(userId) as { kind: string; n: number }[];
  const byCat = d.prepare("SELECT category, COUNT(*) AS n FROM challenge_submissions WHERE user_id = ? GROUP BY category").all(userId) as {
    category: string;
    n: number;
  }[];
  const total = byKind.reduce((a, b) => a + b.n, 0);
  const completed = new Set(
    (d.prepare("SELECT DISTINCT challenge_slug FROM challenge_submissions WHERE user_id = ?").all(userId) as { challenge_slug: string }[]).map(
      (r) => r.challenge_slug,
    ),
  );
  const patterns: Record<string, number> = {};
  for (const r of d.prepare("SELECT feedback FROM challenge_submissions WHERE user_id = ? AND feedback IS NOT NULL").all(userId) as { feedback: string }[]) {
    for (const p of parseJson<ChallengeFeedback | null>(r.feedback, null)?.thinkingPatterns ?? []) {
      const k = p.toLowerCase();
      patterns[k] = (patterns[k] ?? 0) + 1;
    }
  }
  const todayDone = days.includes(utcDay());
  return {
    ...computeStreak(days, utcDay()),
    total,
    todayDone,
    activeDays: days.length,
    byKind: Object.fromEntries(byKind.map((r) => [r.kind, r.n])),
    byCategory: Object.fromEntries(byCat.map((r) => [r.category, r.n])),
    completedSlugs: [...completed],
    patterns,
  };
}

// ============================ Hackathon sessions ============================

export interface HackathonSession {
  id: string;
  title: string;
  inputs: Record<string, unknown>;
  results: HackathonIdea[];
  shortlist: number[];
  createdAt: string;
}

type HackRow = { id: string; title: string; inputs: string; results: string; shortlist: string; created_at: string };
const mapHack = (r: HackRow): HackathonSession => ({
  id: r.id,
  title: r.title,
  inputs: parseJson(r.inputs, {}),
  results: parseJson<HackathonIdea[]>(r.results, []),
  shortlist: parseJson<number[]>(r.shortlist, []),
  createdAt: r.created_at,
});

export function createHackathonSession(userId: string, title: string, inputs: unknown, results: HackathonIdea[]): HackathonSession {
  const id = newId("h_");
  db()
    .prepare("INSERT INTO hackathon_sessions (id, user_id, title, inputs, results, shortlist, created_at) VALUES (?, ?, ?, ?, ?, '[]', ?)")
    .run(id, userId, title, JSON.stringify(inputs), JSON.stringify(results), nowIso());
  return getHackathonSession(userId, id)!;
}

export function getHackathonSession(userId: string, id: string): HackathonSession | null {
  const r = db().prepare("SELECT * FROM hackathon_sessions WHERE id = ? AND user_id = ?").get(id, userId) as HackRow | undefined;
  return r ? mapHack(r) : null;
}

export function listHackathonSessions(userId: string): Pick<HackathonSession, "id" | "title" | "createdAt">[] {
  return (db().prepare("SELECT id, title, created_at FROM hackathon_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20").all(userId) as {
    id: string;
    title: string;
    created_at: string;
  }[]).map((r) => ({ id: r.id, title: r.title, createdAt: r.created_at }));
}

export function setShortlist(userId: string, id: string, shortlist: number[]) {
  const s = getHackathonSession(userId, id);
  if (!s) throw new HttpError(404, "Session not found.", "not_found");
  const valid = [...new Set(shortlist)].filter((i) => Number.isInteger(i) && i >= 0 && i < s.results.length);
  db().prepare("UPDATE hackathon_sessions SET shortlist = ? WHERE id = ?").run(JSON.stringify(valid), id);
  return valid;
}

export function deleteHackathonSession(userId: string, id: string) {
  db().prepare("DELETE FROM hackathon_sessions WHERE id = ? AND user_id = ?").run(id, userId);
}

// ============================ Projects (Build Mode) ============================

export const PROJECT_STATUSES = ["planned", "building", "paused", "completed"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface ProjectTask {
  id: string;
  milestone: string;
  title: string;
  done: boolean;
  position: number;
}

export interface Project {
  id: string;
  ideaId: string | null;
  idea: Idea | null;
  title: string;
  status: ProjectStatus;
  plan: ProjectPlan;
  tasks: ProjectTask[];
  progress: number;
  createdAt: string;
  updatedAt: string;
}

type ProjRow = { id: string; idea_id: string | null; title: string; status: string; plan: string; created_at: string; updated_at: string };

function tasksFor(projectId: string): ProjectTask[] {
  return (db().prepare("SELECT * FROM project_tasks WHERE project_id = ? ORDER BY position").all(projectId) as {
    id: string;
    milestone: string;
    title: string;
    done: number;
    position: number;
  }[]).map((t) => ({ id: t.id, milestone: t.milestone, title: t.title, done: t.done === 1, position: t.position }));
}

function mapProject(r: ProjRow, userId: string, withIdea = true): Project {
  const tasks = tasksFor(r.id);
  const done = tasks.filter((t) => t.done).length;
  return {
    id: r.id,
    ideaId: r.idea_id,
    idea: withIdea && r.idea_id ? (getIdeas([r.idea_id], userId)[0] ?? null) : null,
    title: r.title,
    status: r.status as ProjectStatus,
    plan: parseJson<ProjectPlan>(r.plan, {} as ProjectPlan),
    tasks,
    progress: tasks.length ? done / tasks.length : 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function createProject(userId: string, ideaId: string | null, plan: ProjectPlan): Project {
  const id = newId("p_");
  const now = nowIso();
  const d = db();
  d.exec("BEGIN");
  try {
    d.prepare("INSERT INTO projects (id, user_id, idea_id, title, status, plan, created_at, updated_at) VALUES (?, ?, ?, ?, 'planned', ?, ?, ?)").run(
      id,
      userId,
      ideaId,
      plan.title,
      JSON.stringify(plan),
      now,
      now,
    );
    const ins = d.prepare("INSERT INTO project_tasks (id, project_id, milestone, title, done, position) VALUES (?, ?, ?, ?, 0, ?)");
    let pos = 0;
    for (const m of plan.milestones) for (const t of m.tasks) ins.run(newId("t_"), id, m.name, t, pos++);
    d.exec("COMMIT");
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
  if (ideaId) {
    d.prepare("UPDATE vault_items SET status = 'planned', updated_at = ? WHERE user_id = ? AND idea_id = ? AND status IN ('interesting','exploring')").run(
      now,
      userId,
      ideaId,
    );
  }
  return getProject(userId, id)!;
}

export function getProject(userId: string, id: string): Project | null {
  const r = db().prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?").get(id, userId) as ProjRow | undefined;
  return r ? mapProject(r, userId) : null;
}

export function listProjects(userId: string): Project[] {
  return (db().prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC").all(userId) as ProjRow[]).map((r) => mapProject(r, userId, false));
}

function ownProject(userId: string, id: string) {
  if (!db().prepare("SELECT 1 FROM projects WHERE id = ? AND user_id = ?").get(id, userId)) throw new HttpError(404, "Project not found.", "not_found");
}

function touch(id: string) {
  db().prepare("UPDATE projects SET updated_at = ? WHERE id = ?").run(nowIso(), id);
}

export function updateProject(userId: string, id: string, patch: { title?: string; status?: ProjectStatus; plan?: ProjectPlan }) {
  ownProject(userId, id);
  const d = db();
  if (patch.title) d.prepare("UPDATE projects SET title = ? WHERE id = ?").run(patch.title, id);
  if (patch.plan) d.prepare("UPDATE projects SET plan = ? WHERE id = ?").run(JSON.stringify(patch.plan), id);
  if (patch.status) {
    d.prepare("UPDATE projects SET status = ? WHERE id = ?").run(patch.status, id);
    // keep the vault in sync with real progress
    const row = d.prepare("SELECT idea_id FROM projects WHERE id = ?").get(id) as { idea_id: string | null };
    const vaultStatus = { planned: "planned", building: "building", paused: "planned", completed: "completed" }[patch.status];
    if (row.idea_id) d.prepare("UPDATE vault_items SET status = ?, updated_at = ? WHERE user_id = ? AND idea_id = ?").run(vaultStatus, nowIso(), userId, row.idea_id);
  }
  touch(id);
}

export function deleteProject(userId: string, id: string) {
  ownProject(userId, id);
  db().prepare("DELETE FROM projects WHERE id = ?").run(id);
}

export function addTask(userId: string, projectId: string, milestone: string, title: string): ProjectTask {
  ownProject(userId, projectId);
  const pos = (db().prepare("SELECT COALESCE(MAX(position), -1) + 1 AS p FROM project_tasks WHERE project_id = ?").get(projectId) as { p: number }).p;
  const id = newId("t_");
  db().prepare("INSERT INTO project_tasks (id, project_id, milestone, title, done, position) VALUES (?, ?, ?, ?, 0, ?)").run(id, projectId, milestone, title, pos);
  touch(projectId);
  return { id, milestone, title, done: false, position: pos };
}

export function updateTask(userId: string, projectId: string, taskId: string, patch: { done?: boolean; title?: string }) {
  ownProject(userId, projectId);
  const d = db();
  if (patch.done !== undefined) d.prepare("UPDATE project_tasks SET done = ? WHERE id = ? AND project_id = ?").run(patch.done ? 1 : 0, taskId, projectId);
  if (patch.title) d.prepare("UPDATE project_tasks SET title = ? WHERE id = ? AND project_id = ?").run(patch.title, taskId, projectId);
  // first checked task moves a planned project to building
  if (patch.done) d.prepare("UPDATE projects SET status = 'building' WHERE id = ? AND status = 'planned'").run(projectId);
  touch(projectId);
}

export function deleteTask(userId: string, projectId: string, taskId: string) {
  ownProject(userId, projectId);
  db().prepare("DELETE FROM project_tasks WHERE id = ? AND project_id = ?").run(taskId, projectId);
  touch(projectId);
}

// ============================ Profile / creativity ============================

export function profileStats(userId: string) {
  const d = db();
  const one = (sql: string) => (d.prepare(sql).get(userId) as { n: number }).n;
  const explored = d
    .prepare(
      `SELECT i.category AS category, COUNT(*) AS n FROM interactions x JOIN ideas i ON i.id = x.idea_id WHERE x.user_id = ? AND x.kind != 'hide' GROUP BY i.category`,
    )
    .all(userId) as { category: string; n: number }[];
  return {
    saved: one("SELECT COUNT(*) AS n FROM vault_items WHERE user_id = ?"),
    liked: one("SELECT COUNT(*) AS n FROM likes WHERE user_id = ?"),
    remixed: one("SELECT COUNT(*) AS n FROM remixes WHERE user_id = ?"),
    generated: one("SELECT COUNT(*) AS n FROM ideas WHERE owner_id = ? AND source_kind = 'ai'"),
    projectsStarted: one("SELECT COUNT(*) AS n FROM projects WHERE user_id = ?"),
    projectsCompleted: one("SELECT COUNT(*) AS n FROM projects WHERE user_id = ? AND status = 'completed'"),
    challenges: one("SELECT COUNT(*) AS n FROM challenge_submissions WHERE user_id = ?"),
    explored: Object.fromEntries(explored.map((r) => [r.category, r.n])),
  };
}

export function ownedIdeas(userId: string, kind: "ai" | "remix" | "user", limit = 30): Idea[] {
  return (db().prepare("SELECT * FROM ideas WHERE owner_id = ? AND source_kind = ? ORDER BY created_at DESC LIMIT ?").all(userId, kind, limit) as unknown as IdeaRow[]).map(
    rowToIdea,
  );
}
