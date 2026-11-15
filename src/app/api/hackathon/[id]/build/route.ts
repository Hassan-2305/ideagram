import { z } from "zod";
import { body, HttpError, json, rateLimit, route } from "@/lib/api";
import { planProject } from "@/lib/ai/engines";
import { insertIdea, type NewIdea } from "@/lib/repo/ideas";
import { saveIdea } from "@/lib/repo/vault";
import { createProject, getHackathonSession } from "@/lib/repo/workspace";

/** Turns one hackathon suggestion into a saved idea + full implementation plan. */
export const POST = route<{ id: string }>(async ({ req, user, params }) => {
  const { index } = await body(req, z.object({ index: z.number().int().min(0).max(20) }));
  rateLimit(`ai-heavy:${user.id}`, 4, 60);
  const session = getHackathonSession(user.id, params.id);
  const h = session?.results[index];
  if (!session || !h) throw new HttpError(404, "That suggestion no longer exists.", "not_found");
  const inputs = session.inputs as { hours?: number; teamSize?: number; skills?: string };
  const draft = {
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
  } satisfies NewIdea;
  // Plan first: if the AI call fails, nothing is written and a retry starts clean.
  const plan = await planProject(
    { ...draft, id: "draft", sourceUrl: null, creator: null, publishedAt: null, createdAt: new Date().toISOString(), ownerId: user.id, isPublic: false, parentIds: [], likeCount: 0, saveCount: 0 },
    `Hackathon project: ${inputs.hours ?? "?"} hours, team of ${inputs.teamSize ?? "?"} (${inputs.skills || "skills unspecified"}). Milestones must fit the time box. Demo strategy: ${h.demoStrategy}`,
    user.id,
  );
  const idea = insertIdea(draft);
  saveIdea(user.id, idea.id);
  const project = createProject(user.id, idea.id, plan);
  return json({ projectId: project.id }, 201);
});
