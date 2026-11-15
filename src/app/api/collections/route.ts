import { body, json, route } from "@/lib/api";
import { createCollection, listCollections } from "@/lib/repo/vault";
import { CollectionSchema } from "@/lib/validation";

export const GET = route(async ({ user }) => json({ collections: listCollections(user.id) }));

export const POST = route(async ({ req, user }) => {
  const input = await body(req, CollectionSchema);
  return json({ collection: createCollection(user.id, input.name, input.description ?? "") }, 201);
});
