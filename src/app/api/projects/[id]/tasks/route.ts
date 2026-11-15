import { body, json, route } from "@/lib/api";
import { addTask } from "@/lib/repo/workspace";
import { TaskCreateSchema } from "@/lib/validation";

export const POST = route<{ id: string }>(async ({ req, user, params }) => {
  const input = await body(req, TaskCreateSchema);
  return json({ task: addTask(user.id, params.id, input.milestone, input.title) }, 201);
});
