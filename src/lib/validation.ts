import { z } from "zod";
import { CATEGORY_SLUGS, DIFFICULTIES, VAULT_STATUSES } from "./types";

const text = (max: number) => z.string().trim().max(max);

export const SignupSchema = z.object({
  name: z.string().trim().min(1, "is required").max(60),
  email: z.string().trim().toLowerCase().email("must be a valid email").max(254),
  password: z.string().min(8, "must be at least 8 characters").max(200),
});

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("must be a valid email").max(254),
  password: z.string().min(1, "is required").max(200),
});

export const IdeaActionSchema = z.object({
  action: z.enum(["like", "unlike", "save", "unsave", "hide", "unhide", "interesting", "report", "view"]),
  reason: z.enum(["inaccurate", "broken-source", "duplicate", "low-quality", "inappropriate"]).optional(),
  note: text(500).optional(),
});

export const UserIdeaSchema = z.object({
  title: text(120).min(3, "needs at least 3 characters"),
  summary: text(400).min(1, "is required"),
  problem: text(2000).default(""),
  solution: text(2000).default(""),
  category: z.enum(CATEGORY_SLUGS),
  difficulty: z.enum(DIFFICULTIES).default("intermediate"),
  stack: z.array(text(40)).max(10).default([]),
});

export const VaultPatchSchema = z.object({
  status: z.enum(VAULT_STATUSES).optional(),
  notes: text(10_000).optional(),
  tags: z.array(text(30).min(1)).max(12).optional(),
});

export const CollectionSchema = z.object({
  name: text(60).min(1, "is required"),
  description: text(300).optional(),
});

export const MembershipSchema = z.object({ ideaId: z.string().max(64), member: z.boolean() });

export const GenerateSchema = z.object({
  style: z.enum(["practical", "unconventional", "experimental", "startup", "hackathon", "beginner", "advanced", "social-impact", "unrelated-tech"]),
  count: z.number().int().min(1).max(5).default(3),
  topic: text(200).optional(),
  industry: text(100).optional(),
  technology: text(150).optional(),
  skillLevel: text(50).optional(),
  time: text(50).optional(),
  budget: text(50).optional(),
  teamSize: text(30).optional(),
  problemCategory: text(100).optional(),
  platform: text(60).optional(),
  constraints: text(600).optional(),
});

export const RemixSchema = z
  .object({
    ideaIds: z.array(z.string().max(64)).max(4).default([]),
    concepts: z.array(text(120).min(1)).max(4).default([]),
    instruction: text(400).default(""),
  })
  .refine((v) => v.ideaIds.length + v.concepts.length >= 2, { message: "Pick at least two ideas or concepts to combine." })
  .refine((v) => v.ideaIds.length + v.concepts.length <= 4, { message: "Combine at most four inputs." });

export const HackathonSchema = z.object({
  theme: text(300).min(2, "is required"),
  hours: z.number().int().min(2).max(240),
  teamSize: z.number().int().min(1).max(10),
  skills: text(400).default(""),
  technologies: text(300).default(""),
  hardware: text(200).default(""),
  budget: text(80).default(""),
  audience: text(200).default(""),
  judging: text(400).default(""),
  difficulty: text(40).default(""),
  count: z.number().int().min(3).max(6).default(5),
});

export const ShortlistSchema = z.object({ shortlist: z.array(z.number().int().min(0).max(20)).max(20) });

export const ProjectCreateSchema = z.object({ ideaId: z.string().max(64), context: text(600).default("") });

export const PlanEditSchema = z.object({
  title: text(120).min(1).optional(),
  status: z.enum(["planned", "building", "paused", "completed"]).optional(),
  plan: z.record(z.string(), z.unknown()).optional(),
});

export const TaskCreateSchema = z.object({ milestone: text(120).min(1), title: text(300).min(1) });
export const TaskPatchSchema = z.object({ done: z.boolean().optional(), title: text(300).min(1).optional() });

export const SubmitSchema = z.object({
  challengeSlug: z.string().max(120),
  response: text(6000).min(20, "— write at least a couple of sentences so there's something to reflect on"),
});

export const PreferencesSchema = z.object({
  categories: z.array(z.enum(CATEGORY_SLUGS)).max(15).optional(),
  technologies: z.array(text(40).min(1)).max(20).optional(),
  difficulty: z.enum(DIFFICULTIES).nullable().optional(),
  exploration: z.number().min(0).max(0.6).optional(),
  personalization: z.boolean().optional(),
  onboarded: z.boolean().optional(),
});
