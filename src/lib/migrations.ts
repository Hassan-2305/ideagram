export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: "initial schema",
    sql: `
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,               -- sha256(token); raw token lives only in the cookie
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

CREATE TABLE preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  categories TEXT NOT NULL DEFAULT '[]',
  technologies TEXT NOT NULL DEFAULT '[]',
  difficulty TEXT,
  exploration REAL NOT NULL DEFAULT 0.25,
  personalization INTEGER NOT NULL DEFAULT 1,
  onboarded INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE ideas (
  id TEXT PRIMARY KEY,
  external_id TEXT UNIQUE,           -- dedup key for ingested/editorial content
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  problem TEXT NOT NULL DEFAULT '',
  solution TEXT NOT NULL DEFAULT '',
  insight TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'intermediate',
  build_time TEXT NOT NULL DEFAULT '',
  stack TEXT NOT NULL DEFAULT '[]',
  tags TEXT NOT NULL DEFAULT '[]',
  source_kind TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT,
  creator TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL,
  owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  is_public INTEGER NOT NULL DEFAULT 1,
  details TEXT,
  parent_ids TEXT NOT NULL DEFAULT '[]',
  like_count INTEGER NOT NULL DEFAULT 0,
  save_count INTEGER NOT NULL DEFAULT 0,
  quality REAL NOT NULL DEFAULT 0.5
);
CREATE INDEX idx_ideas_public_cat ON ideas(is_public, category);
CREATE INDEX idx_ideas_owner ON ideas(owner_id);
CREATE INDEX idx_ideas_created ON ideas(created_at);
CREATE INDEX idx_ideas_source ON ideas(source_kind);

CREATE VIRTUAL TABLE ideas_fts USING fts5(
  title, summary, problem, solution, stack, tags,
  content='ideas', content_rowid='rowid', tokenize='porter unicode61'
);
CREATE TRIGGER ideas_ai AFTER INSERT ON ideas BEGIN
  INSERT INTO ideas_fts(rowid, title, summary, problem, solution, stack, tags)
  VALUES (new.rowid, new.title, new.summary, new.problem, new.solution, new.stack, new.tags);
END;
CREATE TRIGGER ideas_ad AFTER DELETE ON ideas BEGIN
  INSERT INTO ideas_fts(ideas_fts, rowid, title, summary, problem, solution, stack, tags)
  VALUES ('delete', old.rowid, old.title, old.summary, old.problem, old.solution, old.stack, old.tags);
END;
CREATE TRIGGER ideas_au AFTER UPDATE OF title, summary, problem, solution, stack, tags ON ideas BEGIN
  INSERT INTO ideas_fts(ideas_fts, rowid, title, summary, problem, solution, stack, tags)
  VALUES ('delete', old.rowid, old.title, old.summary, old.problem, old.solution, old.stack, old.tags);
  INSERT INTO ideas_fts(rowid, title, summary, problem, solution, stack, tags)
  VALUES (new.rowid, new.title, new.summary, new.problem, new.solution, new.stack, new.tags);
END;

CREATE TABLE interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_interactions_user ON interactions(user_id, created_at);

CREATE TABLE likes (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, idea_id)
);

CREATE TABLE hidden_ideas (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, idea_id)
);

CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE vault_items (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'interesting',
  notes TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, idea_id)
);
CREATE INDEX idx_vault_user ON vault_items(user_id, updated_at);

CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX idx_collections_user ON collections(user_id);

CREATE TABLE collection_items (
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  added_at TEXT NOT NULL,
  PRIMARY KEY (collection_id, idea_id)
);

CREATE TABLE remixes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  input_ids TEXT NOT NULL,
  instruction TEXT NOT NULL DEFAULT '',
  result_idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_remixes_user ON remixes(user_id, created_at);

CREATE TABLE challenge_submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_slug TEXT NOT NULL,
  kind TEXT NOT NULL,
  category TEXT NOT NULL,
  response TEXT NOT NULL,
  feedback TEXT,
  day TEXT NOT NULL,                 -- YYYY-MM-DD (UTC) for streaks
  created_at TEXT NOT NULL
);
CREATE INDEX idx_subs_user ON challenge_submissions(user_id, day);

CREATE TABLE hackathon_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  inputs TEXT NOT NULL,
  results TEXT NOT NULL,
  shortlist TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);
CREATE INDEX idx_hack_user ON hackathon_sessions(user_id, created_at);

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idea_id TEXT REFERENCES ideas(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  plan TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_projects_user ON projects(user_id, updated_at);

CREATE TABLE project_tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone TEXT NOT NULL,
  title TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL
);
CREATE INDEX idx_tasks_project ON project_tasks(project_id, position);

CREATE TABLE ai_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  engine TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd REAL NOT NULL DEFAULT 0,
  ok INTEGER NOT NULL,
  error TEXT,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_ai_usage_user ON ai_usage(user_id, created_at);

CREATE TABLE ai_cache (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE ingest_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  ran_at TEXT NOT NULL,
  added INTEGER NOT NULL DEFAULT 0,
  error TEXT
);

CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL
);

CREATE TABLE error_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scope TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`,
  },
];
