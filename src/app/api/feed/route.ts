import { json, publicRoute } from "@/lib/api";
import { getFeed, type FeedSort } from "@/lib/repo/feed";
import { userStates } from "@/lib/repo/ideas";
import { CATEGORY_SLUGS, DIFFICULTIES } from "@/lib/types";

const SORTS: FeedSort[] = ["for-you", "newest", "popular", "quick"];
const SOURCES = ["editorial", "hackernews", "github", "community", "mine"];

export const GET = publicRoute(async ({ req, user }) => {
  const sp = req.nextUrl.searchParams;
  const category = sp.get("category");
  const sort = sp.get("sort") as FeedSort | null;
  const source = sp.get("source");
  const difficulty = sp.get("difficulty");
  const page = getFeed({
    userId: user?.id ?? null,
    category: category && (CATEGORY_SLUGS as string[]).includes(category) ? category : null,
    sort: sort && SORTS.includes(sort) ? sort : "for-you",
    source: source && SOURCES.includes(source) && (source !== "mine" || user) ? source : null,
    difficulty: difficulty && (DIFFICULTIES as readonly string[]).includes(difficulty) ? difficulty : null,
    q: sp.get("q")?.slice(0, 120) ?? null,
    cursor: Number(sp.get("cursor") ?? 0) || 0,
    limit: Number(sp.get("limit") ?? 12) || 12,
  });
  const states = userStates(user?.id ?? null, page.items.map((i) => i.idea.id));
  return json({ ...page, states });
});
