import { json, rateLimit, route } from "@/lib/api";
import { runSource, SOURCES, sourceStatus } from "@/lib/ingest";

export const GET = route(async () => json({ sources: sourceStatus() }));

/** Manual refresh of external sources. Each source still enforces its own minimum interval. */
export const POST = route(async ({ user }) => {
  rateLimit(`ingest:${user.id}`, 3, 600);
  const results = await Promise.all(SOURCES.map(async (s) => ({ source: s.id, ...(await runSource(s)) })));
  return json({ results, sources: sourceStatus() });
});
