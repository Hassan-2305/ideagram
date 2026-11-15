import { body, json, route } from "@/lib/api";
import { db, nowIso } from "@/lib/db";
import { PreferencesSchema } from "@/lib/validation";

export const PATCH = route(async ({ req, user }) => {
  const p = await body(req, PreferencesSchema);
  const sets: string[] = [];
  const vals: (string | number | null)[] = [];
  if (p.categories) (sets.push("categories = ?"), vals.push(JSON.stringify(p.categories)));
  if (p.technologies) (sets.push("technologies = ?"), vals.push(JSON.stringify(p.technologies)));
  if (p.difficulty !== undefined) (sets.push("difficulty = ?"), vals.push(p.difficulty));
  if (p.exploration !== undefined) (sets.push("exploration = ?"), vals.push(p.exploration));
  if (p.personalization !== undefined) (sets.push("personalization = ?"), vals.push(p.personalization ? 1 : 0));
  if (p.onboarded !== undefined) (sets.push("onboarded = ?"), vals.push(p.onboarded ? 1 : 0));
  sets.push("updated_at = ?");
  vals.push(nowIso());
  db().prepare(`UPDATE preferences SET ${sets.join(", ")} WHERE user_id = ?`).run(...vals, user.id);
  return json({ ok: true });
});
