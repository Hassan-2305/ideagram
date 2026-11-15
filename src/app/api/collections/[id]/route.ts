import { body, json, route } from "@/lib/api";
import { deleteCollection, renameCollection } from "@/lib/repo/vault";
import { CollectionSchema } from "@/lib/validation";

export const PATCH = route<{ id: string }>(async ({ req, user, params }) => {
  const input = await body(req, CollectionSchema);
  renameCollection(user.id, params.id, input.name, input.description);
  return json({ ok: true });
});

export const DELETE = route<{ id: string }>(async ({ user, params }) => {
  deleteCollection(user.id, params.id);
  return json({ ok: true });
});
