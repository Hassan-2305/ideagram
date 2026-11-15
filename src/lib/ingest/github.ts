import type { RawItem, Source } from "./index";

/**
 * Recently created, fast-rising repositories via the public GitHub REST search
 * API. Unauthenticated requests are limited (10 search requests/min); set
 * GITHUB_TOKEN for higher limits.
 */
export const githubSource: Source = {
  id: "github",
  name: "GitHub",
  minIntervalMinutes: 360,
  async fetch(): Promise<RawItem[]> {
    const since = new Date(Date.now() - 21 * 86_400_000).toISOString().slice(0, 10);
    const q = encodeURIComponent(`created:>${since} stars:>150 fork:false`);
    const headers: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "idea-gym" };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const res = await fetch(`https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=30`, {
      headers,
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`GitHub API responded ${res.status}`);
    const data = (await res.json()) as {
      items: {
        id: number;
        full_name: string;
        name: string;
        description: string | null;
        html_url: string;
        owner: { login: string };
        created_at: string;
        stargazers_count: number;
        language: string | null;
        topics?: string[];
        archived: boolean;
      }[];
    };
    return data.items
      .filter((r) => r.description && !r.archived)
      .map((r) => ({
        externalId: `github:${r.id}`,
        title: r.name,
        text: `${r.full_name}: ${r.description}`,
        url: r.html_url,
        creator: r.owner.login,
        publishedAt: r.created_at,
        signals: { stars: r.stargazers_count, language: r.language, topics: r.topics ?? [] },
      }));
  },
};
