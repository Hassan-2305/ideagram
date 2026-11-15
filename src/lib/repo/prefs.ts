import "server-only";
import { db, parseJson } from "../db";

export interface Preferences {
  categories: string[];
  technologies: string[];
  difficulty: string | null;
  exploration: number;
  personalization: boolean;
  onboarded: boolean;
}

export function getPreferences(userId: string): Preferences {
  const r = db().prepare("SELECT * FROM preferences WHERE user_id = ?").get(userId) as
    | { categories: string; technologies: string; difficulty: string | null; exploration: number; personalization: number; onboarded: number }
    | undefined;
  return {
    categories: parseJson<string[]>(r?.categories, []),
    technologies: parseJson<string[]>(r?.technologies, []),
    difficulty: r?.difficulty ?? null,
    exploration: r?.exploration ?? 0.25,
    personalization: (r?.personalization ?? 1) === 1,
    onboarded: (r?.onboarded ?? 0) === 1,
  };
}
