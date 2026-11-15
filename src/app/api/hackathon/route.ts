import { body, json, rateLimit, route } from "@/lib/api";
import { hackathonIdeas } from "@/lib/ai/engines";
import { createHackathonSession, listHackathonSessions } from "@/lib/repo/workspace";
import { HackathonSchema } from "@/lib/validation";

export const GET = route(async ({ user }) => json({ sessions: listHackathonSessions(user.id) }));

export const POST = route(async ({ req, user }) => {
  rateLimit(`ai-heavy:${user.id}`, 4, 60);
  const input = await body(req, HackathonSchema);
  const ideas = await hackathonIdeas(input, user.id);
  const title = input.theme.length > 60 ? input.theme.slice(0, 57) + "…" : input.theme;
  const session = createHackathonSession(user.id, title, input, ideas);
  return json({ session }, 201);
});
