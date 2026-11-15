import { body, HttpError, json, rateLimit, route } from "@/lib/api";
import { getIdea, recordInteraction, reportIdea, setHidden, setLike } from "@/lib/repo/ideas";
import { saveIdea, unsaveIdea } from "@/lib/repo/vault";
import { IdeaActionSchema } from "@/lib/validation";

export const POST = route<{ id: string }>(async ({ req, user, params }) => {
  const input = await body(req, IdeaActionSchema);
  rateLimit(`action:${user.id}`, 300, 3600);
  if (input.action === "report") rateLimit(`report:${user.id}`, 20, 3600);
  const idea = getIdea(params.id, user.id);
  if (!idea) throw new HttpError(404, "Idea not found.", "not_found");
  switch (input.action) {
    case "like":
    case "unlike":
      return json({ likeCount: setLike(user.id, idea.id, input.action === "like") });
    case "save":
      saveIdea(user.id, idea.id);
      break;
    case "unsave":
      unsaveIdea(user.id, idea.id);
      break;
    case "hide":
    case "unhide":
      setHidden(user.id, idea.id, input.action === "hide");
      break;
    case "interesting":
    case "view":
      recordInteraction(user.id, idea.id, input.action);
      break;
    case "report":
      if (!input.reason) throw new HttpError(400, "Choose a reason for the report.", "invalid_input");
      reportIdea(user.id, idea.id, input.reason, input.note ?? null);
      break;
  }
  return json({ ok: true });
});
