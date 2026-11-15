import { authenticate, startSession } from "@/lib/auth";
import { body, HttpError, json, publicRoute, rateLimit } from "@/lib/api";
import { LoginSchema } from "@/lib/validation";

export const POST = publicRoute(async ({ req }) => {
  const input = await body(req, LoginSchema);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  rateLimit(`login:${ip}`, 20, 900);
  rateLimit(`login:${input.email}`, 8, 900);
  const user = authenticate(input.email, input.password);
  if (!user) throw new HttpError(401, "That email and password don't match an account.", "invalid_credentials");
  await startSession(user.id);
  return json({ user });
});
