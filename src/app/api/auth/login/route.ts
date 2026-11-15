import { authenticate, startSession } from "@/lib/auth";
import { body, clearRateLimit, clientIp, HttpError, json, peekRateLimit, publicRoute, rateLimit } from "@/lib/api";
import { LoginSchema } from "@/lib/validation";

export const POST = publicRoute(async ({ req }) => {
  const input = await body(req, LoginSchema);
  rateLimit(`login:${clientIp(req)}`, 30, 900);
  // Per-account limit counts failures only, so nobody can lock out a known email by guessing.
  const failKey = `login-fail:${input.email}`;
  if (peekRateLimit(failKey, 8, 900)) throw new HttpError(429, "Too many failed attempts for this account. Try again in 15 minutes.", "rate_limited");
  const user = await authenticate(input.email, input.password);
  if (!user) {
    try {
      rateLimit(failKey, 8, 900);
    } catch {
      /* limit reached; reported on the next attempt */
    }
    throw new HttpError(401, "That email and password don't match an account.", "invalid_credentials");
  }
  clearRateLimit(failKey);
  await startSession(user.id);
  return json({ user });
});
