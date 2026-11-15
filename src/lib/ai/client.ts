import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { createHash } from "node:crypto";
import type { z } from "zod";
import { db, nowIso } from "../db";
import { HttpError } from "../errors";

/**
 * Model routing for in-app AI features.
 *
 *  heavy    – multi-constraint planning where correctness matters
 *             (hackathon ranking, build plans)           → Claude Opus 5.5
 *  standard – idea generation & remixing                  → Claude Sonnet 5.5
 *  light    – short feedback, summaries, classification   → Claude Haiku 5.5
 *
 * Each tier can be overridden by env (AI_MODEL_HEAVY / _STANDARD / _LIGHT),
 * e.g. AI_MODEL_HEAVY=claude-fable-5-2 for the most capable model.
 */
export type Tier = "heavy" | "standard" | "light";

const DEFAULT_MODELS: Record<Tier, string> = {
  heavy: "claude-opus-5-5",
  standard: "claude-sonnet-5-5",
  light: "claude-haiku-5-5",
};

const DEFAULT_EFFORT: Record<Tier, "low" | "medium" | "high"> = {
  heavy: "high",
  standard: "medium",
  light: "low",
};

// USD per 1M tokens (input, output) for cost monitoring.
const PRICING: Record<string, [number, number]> = {
  "claude-fable-5-2": [8, 40],
  "claude-opus-5-5": [4, 20],
  "claude-sonnet-5-5": [2, 10],
  "claude-haiku-5-5": [0.1, 0.5],
};

export function modelFor(tier: Tier): string {
  const env = { heavy: process.env.AI_MODEL_HEAVY, standard: process.env.AI_MODEL_STANDARD, light: process.env.AI_MODEL_LIGHT }[tier];
  return env || DEFAULT_MODELS[tier];
}

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic({ maxRetries: 2, timeout: 120_000 });
  return client;
}

export class AIUnavailableError extends HttpError {
  constructor(message: string, code = "ai_unavailable") {
    super(503, message, code);
  }
}

export interface RunOptions<S extends z.ZodType> {
  engine: string; // e.g. "generate", "remix" — for usage tracking
  tier: Tier;
  system: string;
  prompt: string;
  schema: S;
  userId: string | null;
  maxTokens?: number;
  cacheKey?: string | null; // when set, identical requests are served from ai_cache
  cacheTtlHours?: number;
}

function costOf(model: string, input: number, output: number) {
  const [pi, po] = PRICING[model] ?? [0, 0];
  return (input * pi + output * po) / 1_000_000;
}

function trackUsage(row: {
  userId: string | null;
  engine: string;
  model: string;
  input: number;
  output: number;
  ok: boolean;
  error?: string;
  ms: number;
}) {
  try {
    db()
      .prepare(
        `INSERT INTO ai_usage (user_id, engine, model, input_tokens, output_tokens, cost_usd, ok, error, duration_ms, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(row.userId, row.engine, row.model, row.input, row.output, costOf(row.model, row.input, row.output), row.ok ? 1 : 0, row.error ?? null, row.ms, nowIso());
  } catch {
    /* never fail a request because usage logging failed */
  }
}

/** Per-user daily budget guard (requests) to cap cost exposure. */
function assertDailyBudget(userId: string | null) {
  if (!userId) return;
  const limit = Number(process.env.AI_DAILY_REQUEST_LIMIT ?? 60);
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const n = (db().prepare("SELECT COUNT(*) AS n FROM ai_usage WHERE user_id = ? AND created_at > ?").get(userId, since) as { n: number }).n;
  if (n >= limit) throw new HttpError(429, `You've reached today's AI limit (${limit} requests). It resets within 24 hours.`, "ai_budget");
}

export function hashKey(parts: unknown): string {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex");
}

/**
 * Runs one structured-output call. Output is parsed against `schema` by the SDK
 * and validated again here; anything that fails validation is an error — we
 * never fabricate a fallback answer.
 */
export async function runStructured<S extends z.ZodType>(opts: RunOptions<S>): Promise<z.infer<S>> {
  if (!aiConfigured()) {
    throw new AIUnavailableError(
      "AI features are not configured on this server. Add ANTHROPIC_API_KEY to .env.local and restart to enable them.",
      "ai_not_configured",
    );
  }
  const model = modelFor(opts.tier);
  const cacheKey = opts.cacheKey ? hashKey([opts.engine, model, opts.cacheKey]) : null;
  if (cacheKey) {
    const hit = db().prepare("SELECT value, created_at FROM ai_cache WHERE key = ?").get(cacheKey) as
      | { value: string; created_at: string }
      | undefined;
    const ttl = (opts.cacheTtlHours ?? 24) * 3_600_000;
    if (hit && Date.now() - new Date(hit.created_at).getTime() < ttl) {
      const parsed = opts.schema.safeParse(JSON.parse(hit.value));
      if (parsed.success) return parsed.data;
    }
  }

  assertDailyBudget(opts.userId);
  const started = Date.now();
  try {
    const res = await getClient().beta.messages.parse({
      model,
      max_tokens: opts.maxTokens ?? 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: DEFAULT_EFFORT[opts.tier], format: betaZodOutputFormat(opts.schema) },
      system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: opts.prompt }],
    });
    const input = res.usage.input_tokens + (res.usage.cache_read_input_tokens ?? 0) + (res.usage.cache_creation_input_tokens ?? 0);
    if (res.stop_reason === "refusal") {
      trackUsage({ userId: opts.userId, engine: opts.engine, model, input, output: res.usage.output_tokens, ok: false, error: "refusal", ms: Date.now() - started });
      throw new HttpError(422, "The AI declined this request. Try rephrasing your input.", "ai_refusal");
    }
    if (res.stop_reason === "max_tokens") {
      trackUsage({ userId: opts.userId, engine: opts.engine, model, input, output: res.usage.output_tokens, ok: false, error: "max_tokens", ms: Date.now() - started });
      throw new HttpError(502, "The AI response was cut off before it finished. Please try again with a narrower request.", "ai_truncated");
    }
    const validated = opts.schema.safeParse(res.parsed_output);
    if (!validated.success) {
      trackUsage({ userId: opts.userId, engine: opts.engine, model, input, output: res.usage.output_tokens, ok: false, error: "invalid_output", ms: Date.now() - started });
      throw new HttpError(502, "The AI returned a response we couldn't validate. Please try again.", "ai_invalid");
    }
    trackUsage({ userId: opts.userId, engine: opts.engine, model, input, output: res.usage.output_tokens, ok: true, ms: Date.now() - started });
    if (cacheKey) {
      db().prepare("INSERT OR REPLACE INTO ai_cache (key, value, created_at) VALUES (?, ?, ?)").run(cacheKey, JSON.stringify(validated.data), nowIso());
    }
    return validated.data;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    const ms = Date.now() - started;
    const fail = (msg: string, code: string, status = 503) => {
      trackUsage({ userId: opts.userId, engine: opts.engine, model, input: 0, output: 0, ok: false, error: code, ms });
      return new HttpError(status, msg, code);
    };
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError)
      throw fail("The server's AI credentials were rejected. An administrator needs to update ANTHROPIC_API_KEY.", "ai_auth");
    if (err instanceof Anthropic.NotFoundError) throw fail(`The configured model "${model}" isn't available to this API key.`, "ai_model");
    if (err instanceof Anthropic.RateLimitError) throw fail("The AI service is rate limited right now. Wait a minute and try again.", "ai_rate_limited", 429);
    if (err instanceof Anthropic.BadRequestError) throw fail("The AI service rejected the request. Try shortening your input.", "ai_bad_request", 400);
    if (err instanceof Anthropic.APIConnectionTimeoutError) throw fail("The AI took too long to respond. Please try again.", "ai_timeout", 504);
    if (err instanceof Anthropic.APIConnectionError) throw fail("Couldn't reach the AI service. Check the server's network connection.", "ai_network");
    if (err instanceof Anthropic.APIError) throw fail("The AI service had a problem. Please try again shortly.", "ai_upstream", 502);
    throw err;
  }
}

export function usageSummary(userId: string) {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const rows = db()
    .prepare(
      `SELECT engine, model, COUNT(*) AS calls, SUM(input_tokens) AS input, SUM(output_tokens) AS output, SUM(cost_usd) AS cost,
        SUM(CASE WHEN ok = 1 THEN 0 ELSE 1 END) AS failures
       FROM ai_usage WHERE user_id = ? AND created_at > ? GROUP BY engine, model ORDER BY calls DESC`,
    )
    .all(userId, since) as { engine: string; model: string; calls: number; input: number; output: number; cost: number; failures: number }[];
  return rows;
}
