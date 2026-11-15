import { body, json, rateLimit, route } from "@/lib/api";
import { insertIdea } from "@/lib/repo/ideas";
import { saveIdea } from "@/lib/repo/vault";
import { UserIdeaSchema } from "@/lib/validation";

/** Capture your own idea straight into the vault (private to you). */
export const POST = route(async ({ req, user }) => {
  const input = await body(req, UserIdeaSchema);
  rateLimit(`write-idea:${user.id}`, 30, 3600);
  const idea = insertIdea({
    ...input,
    insight: "",
    buildTime: "",
    tags: [],
    sourceKind: "user",
    sourceName: "Your idea",
    creator: user.name,
    ownerId: user.id,
    isPublic: false,
  });
  saveIdea(user.id, idea.id);
  return json({ idea }, 201);
});
