import { body, json, route } from "@/lib/api";
import { setCollectionMembership } from "@/lib/repo/vault";
import { MembershipSchema } from "@/lib/validation";

export const POST = route<{ id: string }>(async ({ req, user, params }) => {
  const input = await body(req, MembershipSchema);
  setCollectionMembership(user.id, params.id, input.ideaId, input.member);
  return json({ ok: true });
});
