import { body, HttpError, json, rateLimit, route } from "@/lib/api";
import { remixIdeas } from "@/lib/ai/engines";
import { remixToIdea } from "@/lib/ai/convert";
import { getIdeas, insertIdea, recordInteraction } from "@/lib/repo/ideas";
import { listRemixes, recordRemix } from "@/lib/repo/workspace";
import { RemixSchema } from "@/lib/validation";

export const GET = route(async ({ user }) => json({ remixes: listRemixes(user.id) }));

export const POST = route(async ({ req, user }) => {
  const input = await body(req, RemixSchema);
  rateLimit(`ai:${user.id}`, 10, 60);
  const ideas = getIdeas(input.ideaIds, user.id);
  if (ideas.length !== input.ideaIds.length) throw new HttpError(404, "One of the selected ideas is no longer available.", "not_found");
  const inputs = [
    ...ideas.map((i) => ({ label: i.title, text: `${i.summary}\n${i.problem ? `Problem: ${i.problem}\n` : ""}${i.solution ? `Solution: ${i.solution}` : ""}` })),
    ...input.concepts.map((c) => ({ label: c, text: `A free-form concept or technology: "${c}".` })),
  ];
  const result = await remixIdeas(inputs, input.instruction, user.id);
  const idea = insertIdea(remixToIdea(result, user.id, ideas.map((i) => i.id)));
  recordRemix(user.id, ideas.map((i) => i.id), [input.instruction, ...input.concepts.map((c) => `+ ${c}`)].filter(Boolean).join(" · "), idea.id);
  for (const i of ideas) recordInteraction(user.id, i.id, "remix");
  return json({ idea, feasibility: result.feasibilityRating });
});
