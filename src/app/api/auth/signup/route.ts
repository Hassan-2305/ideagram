import { createUser, startSession, AuthError } from "@/lib/auth";
import { body, HttpError, json, publicRoute, rateLimit } from "@/lib/api";
import { SignupSchema } from "@/lib/validation";

export const POST = publicRoute(async ({ req }) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  rateLimit(`signup:${ip}`, 10, 3600);
  const input = await body(req, SignupSchema);
  try {
    const user = createUser(input.email, input.name, input.password);
    await startSession(user.id);
    return json({ user }, 201);
  } catch (e) {
    if (e instanceof AuthError) throw new HttpError(409, e.message, "email_taken");
    throw e;
  }
});
