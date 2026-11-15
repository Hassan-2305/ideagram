import { body, json, route } from "@/lib/api";
import { db, nowIso } from "@/lib/db";
import { PreferencesSchema } from "@/lib/validation";

export const PATCH = route(async ({ req, user }) => {
  const p = await body(req, PreferencesSchema);
  const sets: string[] = [];
  const vals: (string | number | null)[] = [];
  const add = (col: string, v: string | number | null) => {
    sets.push(`${col} = ?`);
    vals.push(v);
  };
  if (p.categories) add("categories", JSON.stringify(p.categories));
  if (p.technologies) add("technologies", JSON.stringify(p.technologies));
  if (p.difficulty !== undefined) add("difficulty", p.difficulty);
  if (p.exploration !== undefined) add("exploration", p.exploration);
  if (p.personalization !== undefined) add("personalization", p.personalization ? 1 : 0);
  if (p.onboarded !== undefined) add("onboarded", p.onboarded ? 1 : 0);
  sets.push("updated_at = ?");
  vals.push(nowIso());
  db().prepare(`UPDATE preferences SET ${sets.join(", ")} WHERE user_id = ?`).run(...vals, user.id);
  return json({ ok: true });
});
