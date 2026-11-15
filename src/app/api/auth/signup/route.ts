import { createUser, startSession, AuthError } from "@/lib/auth";
import { body, clientIp, HttpError, json, publicRoute, rateLimit } from "@/lib/api";
import { SignupSchema } from "@/lib/validation";

export const POST = publicRoute(async ({ req }) => {
  const input = await body(req, SignupSchema);
  rateLimit(`signup:${clientIp(req)}`, 10, 3600);
  try {
    const user = await createUser(input.email, input.name, input.password);
    await startSession(user.id);
    return json({ user }, 201);
  } catch (e) {
    if (e instanceof AuthError) throw new HttpError(409, e.message, "email_taken");
    throw e;
  }
});
