import { body, json, route } from "@/lib/api";
import { unsaveIdea, updateVaultItem } from "@/lib/repo/vault";
import { VaultPatchSchema } from "@/lib/validation";

export const PATCH = route<{ ideaId: string }>(async ({ req, user, params }) => {
  const patch = await body(req, VaultPatchSchema);
  updateVaultItem(user.id, params.ideaId, patch);
  return json({ ok: true });
});

export const DELETE = route<{ ideaId: string }>(async ({ user, params }) => {
  unsaveIdea(user.id, params.ideaId);
  return json({ ok: true });
});
