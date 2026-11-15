import { endSession } from "@/lib/auth";
import { json, publicRoute } from "@/lib/api";

export const POST = publicRoute(async () => {
  await endSession();
  return json({ ok: true });
});
