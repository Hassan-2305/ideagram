import { json, route } from "@/lib/api";
import { db, nowIso } from "@/lib/db";

/** Resets personalization: clears interaction history, hidden ideas and stated interests. Vault is kept. */
export const POST = route(async ({ user }) => {
  const d = db();
  d.exec("BEGIN");
  try {
    d.prepare("DELETE FROM interactions WHERE user_id = ?").run(user.id);
    d.prepare("DELETE FROM hidden_ideas WHERE user_id = ?").run(user.id);
    d.prepare("UPDATE preferences SET categories = '[]', technologies = '[]', difficulty = NULL, exploration = 0.25, updated_at = ? WHERE user_id = ?").run(nowIso(), user.id);
    d.exec("COMMIT");
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
  return json({ ok: true });
});
