import { json, route } from "@/lib/api";
import { listCollections, listVault } from "@/lib/repo/vault";

export const GET = route(async ({ req, user }) => {
  const sp = req.nextUrl.searchParams;
  const items = listVault(user.id, {
    q: sp.get("q")?.slice(0, 100) || undefined,
    status: sp.get("status") || undefined,
    collectionId: sp.get("collection") || undefined,
    tag: sp.get("tag")?.slice(0, 30) || undefined,
  });
  return json({ items, collections: listCollections(user.id) });
});
