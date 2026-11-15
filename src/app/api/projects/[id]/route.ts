import { body, HttpError, json, rateLimit, route } from "@/lib/api";
import { ProjectPlanSchema, type ProjectPlan } from "@/lib/ai/schemas";
import { deleteProject, getProject, updateProject } from "@/lib/repo/workspace";
import { PlanEditSchema } from "@/lib/validation";

export const GET = route<{ id: string }>(async ({ user, params }) => {
  const project = getProject(user.id, params.id);
  if (!project) throw new HttpError(404, "Project not found.", "not_found");
  return json({ project });
});

export const PATCH = route<{ id: string }>(async ({ req, user, params }) => {
  const input = await body(req, PlanEditSchema);
  rateLimit(`project-edit:${user.id}`, 120, 3600);
  if (input.plan && JSON.stringify(input.plan).length > 100_000) throw new HttpError(413, "The plan is too large to save.", "too_large");
  let plan: ProjectPlan | undefined;
  if (input.plan) {
    const parsed = ProjectPlanSchema.safeParse(input.plan);
    if (!parsed.success) throw new HttpError(400, "The edited plan is missing required sections.", "invalid_plan");
    plan = parsed.data;
  }
  updateProject(user.id, params.id, { title: input.title, status: input.status, plan });
  return json({ project: getProject(user.id, params.id) });
});

export const DELETE = route<{ id: string }>(async ({ user, params }) => {
  deleteProject(user.id, params.id);
  return json({ ok: true });
});
