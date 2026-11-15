import { HttpError, json, rateLimit, route } from "@/lib/api";
import { similarIdeas } from "@/lib/ai/engines";
import { generatedToIdea } from "@/lib/ai/convert";
import { getIdea, insertIdea } from "@/lib/repo/ideas";

export const POST = route<{ id: string }>(async ({ user, params }) => {
  rateLimit(`ai:${user.id}`, 10, 60);
  const seed = getIdea(params.id, user.id);
  if (!seed) throw new HttpError(404, "Idea not found.", "not_found");
  const generated = await similarIdeas(seed, user.id, 3);
  const ideas = generated.map((g) => insertIdea(generatedToIdea(g, user.id, [seed.id])));
  return json({ ideas });
});
