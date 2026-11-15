import { body, json, rateLimit, route } from "@/lib/api";
import { generateIdeas } from "@/lib/ai/engines";
import { generatedToIdea } from "@/lib/ai/convert";
import { insertIdea, userStates } from "@/lib/repo/ideas";
import { GenerateSchema } from "@/lib/validation";

export const POST = route(async ({ req, user }) => {
  rateLimit(`ai:${user.id}`, 10, 60);
  const input = await body(req, GenerateSchema);
  const generated = await generateIdeas(input, user.id);
  // Persist as private ideas so they can be opened, saved, remixed and built.
  const ideas = generated.map((g) => insertIdea(generatedToIdea(g, user.id)));
  return json({ ideas, states: userStates(user.id, ideas.map((i) => i.id)) });
});
