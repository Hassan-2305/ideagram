import { z } from "zod";
import { body, HttpError, json, rateLimit, route } from "@/lib/api";
import { planProject } from "@/lib/ai/engines";
import { insertIdea } from "@/lib/repo/ideas";
import { saveIdea } from "@/lib/repo/vault";
import { createProject, getHackathonSession } from "@/lib/repo/workspace";

/** Turns one hackathon suggestion into a saved idea + full implementation plan. */
export const POST = route<{ id: string }>(async ({ req, user, params }) => {
  rateLimit(`ai-heavy:${user.id}`, 4, 60);
  const { index } = await body(req, z.object({ index: z.number().int().min(0).max(20) }));
  const session = getHackathonSession(user.id, params.id);
  const h = session?.results[index];
  if (!session || !h) throw new HttpError(404, "That suggestion no longer exists.", "not_found");
  const inputs = session.inputs as { hours?: number; teamSize?: number; skills?: string };
  const idea = insertIdea({
    title: h.title,
    summary: h.overview,
    problem: h.problem,
    solution: h.solution,
    insight: h.usp,
    category: h.category,
    difficulty: h.difficulty,
    buildTime: `${inputs.hours ?? "?"} hours`,
    stack: h.stack,
    tags: ["hackathon"],
    sourceKind: "ai",
    sourceName: "Hackathon Mode",
    ownerId: user.id,
    isPublic: false,
    details: { mvp: h.mvp, implementation: h.architecture, challenges: h.risks },
  });
  saveIdea(user.id, idea.id);
  const plan = await planProject(
    idea,
    `Hackathon project: ${inputs.hours ?? "?"} hours, team of ${inputs.teamSize ?? "?"} (${inputs.skills || "skills unspecified"}). Milestones must fit the time box. Demo strategy: ${h.demoStrategy}`,
    user.id,
  );
  const project = createProject(user.id, idea.id, plan);
  return json({ projectId: project.id }, 201);
});
