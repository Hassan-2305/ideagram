import { route } from "@/lib/api";
import { exportMarkdown, listVault } from "@/lib/repo/vault";

export const GET = route(async ({ req, user }) => {
  const collection = req.nextUrl.searchParams.get("collection") || undefined;
  const format = req.nextUrl.searchParams.get("format") === "json" ? "json" : "md";
  const day = new Date().toISOString().slice(0, 10);
  if (format === "json") {
    return new Response(JSON.stringify(listVault(user.id, { collectionId: collection }), null, 2), {
      headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="idea-vault-${day}.json"` },
    });
  }
  return new Response(exportMarkdown(user.id, collection), {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="idea-vault-${day}.md"` },
  });
});
