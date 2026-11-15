import { json, publicRoute } from "@/lib/api";
import { searchIdeas, userStates } from "@/lib/repo/ideas";

export const GET = publicRoute(async ({ req, user }) => {
  const q = (req.nextUrl.searchParams.get("q") ?? "").slice(0, 120);
  const ideas = searchIdeas(q, user?.id ?? null, 8);
  const states = userStates(user?.id ?? null, ideas.map((i) => i.id));
  // Saved ideas first: your own library is usually what you're looking for.
  const results = ideas
    .map((i) => ({ id: i.id, title: i.title, summary: i.summary, category: i.category, saved: states[i.id]?.saved ?? false }))
    .sort((a, b) => Number(b.saved) - Number(a.saved));
  return json({ results });
});
