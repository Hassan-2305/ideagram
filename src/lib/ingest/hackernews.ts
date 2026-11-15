import type { RawItem, Source } from "./index";

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
        text: h.story_text ?? h.title,
        // Link to the HN discussion; the project URL (if any) is in the post.
        url: `https://news.ycombinator.com/item?id=${h.objectID}`,
        creator: h.author,
        publishedAt: h.created_at,
        signals: { points: h.points },
      }));
  },
};
