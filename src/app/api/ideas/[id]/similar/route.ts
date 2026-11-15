import { HttpError, json, rateLimit, route } from "@/lib/api";
import { similarIdeas } from "@/lib/ai/engines";
import { generatedToIdea } from "@/lib/ai/convert";
import { getIdea, insertIdea, recentChildren } from "@/lib/repo/ideas";

export const POST = route<{ id: string }>(async ({ req, user, params }) => {
  const seed = getIdea(params.id, user.id);
  if (!seed) throw new HttpError(404, "Idea not found.", "not_found");
  // Re-requesting within a few hours returns the variations already made, unless ?fresh=1.
  if (req.nextUrl.searchParams.get("fresh") !== "1") {
    const existing = recentChildren(user.id, seed.id, 6);
    if (existing.length) return json({ ideas: existing.slice(0, 3), reused: true });
  }
  rateLimit(`ai:${user.id}`, 10, 60);
  const generated = await similarIdeas(seed, user.id, 3);
  const ideas = generated.map((g) => insertIdea(generatedToIdea(g, user.id, [seed.id])));
  return json({ ideas });
});
