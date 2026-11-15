import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getUser } from "./auth";
import { db, nowIso } from "./db";
import type { SessionUser } from "./types";

import { HttpError } from "./errors";
export { HttpError };

export function json<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json(data, typeof init === "number" ? { status: init } : init);
}

export function logError(scope: string, err: unknown) {
  const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  console.error(`[idea-gym:${scope}]`, message);
  try {
    db().prepare("INSERT INTO error_log (scope, message, created_at) VALUES (?, ?, ?)").run(scope, message.slice(0, 2000), nowIso());
  } catch {
    /* logging must never throw */
  }
}

/** Reject cross-site mutation requests (defence in depth on top of SameSite=Lax). */
function assertSameOrigin(req: NextRequest) {
  if (req.method === "GET" || req.method === "HEAD") return;
  const origin = req.headers.get("origin");
  if (!origin) return; // non-browser clients / same-origin fetch without Origin
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    if (new URL(origin).host !== host) throw new HttpError(403, "Cross-origin request rejected.", "forbidden");
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(403, "Invalid origin.", "forbidden");
  }
}

/** Fixed-window rate limit stored in SQLite. */
export function rateLimit(key: string, limit: number, windowSec: number) {
  const now = Math.floor(Date.now() / 1000);
  const d = db();
  const row = d.prepare("SELECT window_start, count FROM rate_limits WHERE key = ?").get(key) as
    | { window_start: number; count: number }
    | undefined;
  if (!row || now - row.window_start >= windowSec) {
    d.prepare("INSERT OR REPLACE INTO rate_limits (key, window_start, count) VALUES (?, ?, 1)").run(key, now);
    return;
  }
  if (row.count >= limit) {
    const retry = windowSec - (now - row.window_start);
    throw new HttpError(429, `Too many requests. Try again in ${retry}s.`, "rate_limited");
  }
  d.prepare("UPDATE rate_limits SET count = count + 1 WHERE key = ?").run(key);
}

type Ctx<P> = { params: Promise<P> };

type Handler<P, U> = (args: { req: NextRequest; user: U; params: P }) => Promise<Response>;

function wrap<P, U>(handler: Handler<P, U>, requireAuth: boolean) {
  return async (req: NextRequest, ctx: Ctx<P>) => {
    try {
      assertSameOrigin(req);
      const user = await getUser();
      if (requireAuth && !user) throw new HttpError(401, "Please sign in to continue.", "unauthorized");
      const params = ((await ctx?.params) ?? {}) as P;
      return await handler({ req, user: user as U, params });
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message, code: err.code }, err.status);
      if (err instanceof z.ZodError) {
        const first = err.issues[0];
        return json(
          { error: first ? `${first.path.join(".") || "input"}: ${first.message}` : "Invalid input.", code: "invalid_input" },
          400,
        );
      }
      logError(`api:${req.nextUrl.pathname}`, err);
      return json({ error: "Something went wrong on our side. Please try again.", code: "internal" }, 500);
    }
  };
}

/**
 * Wraps an authenticated route handler: same-origin check, auth, and typed
 * error → JSON mapping. Never leaks stack traces to the client.
 */
export function route<P = Record<string, string>>(handler: Handler<P, SessionUser>) {
  return wrap<P, SessionUser>(handler, true);
}

/** Same as `route` but the user may be signed out. */
export function publicRoute<P = Record<string, string>>(handler: Handler<P, SessionUser | null>) {
  return wrap<P, SessionUser | null>(handler, false);
}

export async function body<T extends z.ZodType>(req: NextRequest, schema: T): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "Request body must be JSON.", "invalid_json");
  }
  return schema.parse(raw);
}
