import { body, HttpError, json, route } from "@/lib/api";
import { deleteHackathonSession, getHackathonSession, setShortlist } from "@/lib/repo/workspace";
import { ShortlistSchema } from "@/lib/validation";

export const GET = route<{ id: string }>(async ({ user, params }) => {
  const session = getHackathonSession(user.id, params.id);
  if (!session) throw new HttpError(404, "Session not found.", "not_found");
  return json({ session });
});

export const PATCH = route<{ id: string }>(async ({ req, user, params }) => {
  const input = await body(req, ShortlistSchema);
  return json({ shortlist: setShortlist(user.id, params.id, input.shortlist) });
});

export const DELETE = route<{ id: string }>(async ({ user, params }) => {
  deleteHackathonSession(user.id, params.id);
  return json({ ok: true });
});
