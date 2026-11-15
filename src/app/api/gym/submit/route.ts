import { body, HttpError, json, route } from "@/lib/api";
import { getChallenge } from "@/lib/challenges";
import { addSubmission, gymStats } from "@/lib/repo/workspace";
import { SubmitSchema } from "@/lib/validation";

/** Records the user's own thinking first; perspectives are only revealed after this. */
export const POST = route(async ({ req, user }) => {
  const input = await body(req, SubmitSchema);
  const c = getChallenge(input.challengeSlug);
  if (!c) throw new HttpError(404, "Challenge not found.", "not_found");
  const submission = addSubmission(user.id, { challengeSlug: c.slug, kind: c.kind, category: c.category, response: input.response });
  return json({ submission, perspectives: c.perspectives, stats: gymStats(user.id) }, 201);
});
