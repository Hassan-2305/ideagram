import { z } from "zod";
import { body, HttpError, json, rateLimit, route } from "@/lib/api";
import { challengeFeedback } from "@/lib/ai/engines";
import { getChallenge } from "@/lib/challenges";
import { getSubmission, setSubmissionFeedback } from "@/lib/repo/workspace";

export const POST = route(async ({ req, user }) => {
  const { submissionId } = await body(req, z.object({ submissionId: z.string().max(64) }));
  rateLimit(`ai:${user.id}`, 10, 60);
  const sub = getSubmission(user.id, submissionId);
  if (!sub) throw new HttpError(404, "Submission not found.", "not_found");
  if (sub.feedback) return json({ feedback: sub.feedback });
  const c = getChallenge(sub.challengeSlug);
  if (!c) throw new HttpError(404, "Challenge not found.", "not_found");
  const feedback = await challengeFeedback(c.prompt, sub.response, user.id);
  setSubmissionFeedback(user.id, sub.id, feedback);
  return json({ feedback });
});
