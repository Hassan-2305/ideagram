import type { RawItem, Source } from "./index";

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "an external site";
  }
}

/**
 * Hacker News "Show HN" posts via the public Algolia HN Search API
 * (https://hn.algolia.com/api). Recent posts (last 14 days) with >= 40 points.
 */
export const hackerNewsSource: Source = {
  id: "hackernews",
  name: "Hacker News",
  minIntervalMinutes: 180,
  async fetch(): Promise<RawItem[]> {
    const since = Math.floor(Date.now() / 1000) - 14 * 86_400;
    const url = `https://hn.algolia.com/api/v1/search?tags=show_hn&numericFilters=points%3E%3D40,created_at_i%3E${since}&hitsPerPage=30`;
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`HN API responded ${res.status}`);
    const data = (await res.json()) as {
      hits: { objectID: string; title: string; url: string | null; author: string; created_at: string; points: number; story_text: string | null }[];
    };
    return data.hits
      .filter((h) => h.title)
      .map((h) => ({
        externalId: `hackernews:${h.objectID}`,
        title: h.title,
        // Link-only posts have no body; describe them honestly instead of showing a raw URL.
        text: h.story_text?.trim() ? h.story_text : `${h.title} — a Show HN post${h.url ? ` linking to ${hostname(h.url)}` : ""}. Open the discussion for the creator's details.`,
        // Link to the HN discussion; the project URL (if any) is in the post.
        url: `https://news.ycombinator.com/item?id=${h.objectID}`,
        creator: h.author,
        publishedAt: h.created_at,
        signals: { points: h.points },
      }));
  },
};
