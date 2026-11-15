import { body, HttpError, json, rateLimit, route } from "@/lib/api";
import { planProject } from "@/lib/ai/engines";
import { getIdea, recordInteraction } from "@/lib/repo/ideas";
import { saveIdea } from "@/lib/repo/vault";
import { createProject, listProjects } from "@/lib/repo/workspace";
import { ProjectCreateSchema } from "@/lib/validation";

export const GET = route(async ({ user }) => json({ projects: listProjects(user.id) }));

export const POST = route(async ({ req, user }) => {
  rateLimit(`ai-heavy:${user.id}`, 4, 60);
  const input = await body(req, ProjectCreateSchema);
  const idea = getIdea(input.ideaId, user.id);
  if (!idea) throw new HttpError(404, "Idea not found.", "not_found");
  const plan = await planProject(idea, input.context, user.id);
  saveIdea(user.id, idea.id);
  const project = createProject(user.id, idea.id, plan);
  recordInteraction(user.id, idea.id, "build");
  return json({ project }, 201);
});
