import { body, json, route } from "@/lib/api";
import { deleteTask, getProject, updateTask } from "@/lib/repo/workspace";
import { TaskPatchSchema } from "@/lib/validation";

export const PATCH = route<{ id: string; taskId: string }>(async ({ req, user, params }) => {
  const input = await body(req, TaskPatchSchema);
  updateTask(user.id, params.id, params.taskId, input);
  const p = getProject(user.id, params.id);
  return json({ progress: p?.progress ?? 0, status: p?.status });
});

export const DELETE = route<{ id: string; taskId: string }>(async ({ user, params }) => {
  deleteTask(user.id, params.id, params.taskId);
  return json({ ok: true });
});
