import { z } from "zod";
import { CATEGORY_SLUGS, DIFFICULTIES } from "../types";

// Schemas used both as structured-output formats and as post-validation.
// Kept to features structured outputs support (no length constraints);
// length limits are enforced after parsing by `clampIdea`.

export const GeneratedIdeaSchema = z.object({
  title: z.string(),
  summary: z.string(),
  problem: z.string(),
  audience: z.string(),
  solution: z.string(),
  whyInteresting: z.string(),
  alternatives: z.array(z.string()),
  differentiation: z.string(),
  mvp: z.array(z.string()),
  implementation: z.string(),
  stack: z.array(z.string()),
  category: z.enum(CATEGORY_SLUGS),
  difficulty: z.enum(DIFFICULTIES),
  buildTime: z.string(),
  challenges: z.array(z.string()),
  extensions: z.array(z.string()),
  tags: z.array(z.string()),
});
export type GeneratedIdea = z.infer<typeof GeneratedIdeaSchema>;

export const GenerateResultSchema = z.object({ ideas: z.array(GeneratedIdeaSchema) });

export const RemixResultSchema = z.object({
  title: z.string(),
  summary: z.string(),
  combined: z.array(z.string()),
  whyItWorks: z.string(),
  opportunity: z.string(),
  differentiation: z.string(),
  feasibility: z.string(),
  feasibilityRating: z.enum(["high", "medium", "low"]),
  prototype: z.array(z.string()),
  problem: z.string(),
  solution: z.string(),
  audience: z.string(),
  stack: z.array(z.string()),
  category: z.enum(CATEGORY_SLUGS),
  difficulty: z.enum(DIFFICULTIES),
  buildTime: z.string(),
  tags: z.array(z.string()),
});
export type RemixResult = z.infer<typeof RemixResultSchema>;

const Score = z.object({ score: z.number(), why: z.string() });

export const HackathonIdeaSchema = z.object({
  title: z.string(),
  overview: z.string(),
  problem: z.string(),
  solution: z.string(),
  usp: z.string(),
  mvp: z.array(z.string()),
  architecture: z.string(),
  stack: z.array(z.string()),
  roadmap: z.array(z.object({ hours: z.string(), goal: z.string() })),
  taskDivision: z.array(z.object({ role: z.string(), tasks: z.array(z.string()) })),
  demoStrategy: z.string(),
  judgeQuestions: z.array(z.object({ question: z.string(), answer: z.string() })),
  risks: z.array(z.string()),
  fallbackPlan: z.string(),
  scores: z.object({
    themeRelevance: Score,
    feasibility: Score,
    novelty: Score,
    demoPotential: Score,
    significance: Score,
    timeFit: Score,
    differentiation: Score,
  }),
  category: z.enum(CATEGORY_SLUGS),
  difficulty: z.enum(DIFFICULTIES),
});
export type HackathonIdea = z.infer<typeof HackathonIdeaSchema>;
export const HackathonResultSchema = z.object({ ideas: z.array(HackathonIdeaSchema) });

export const ProjectPlanSchema = z.object({
  title: z.string(),
  pitch: z.string(),
  requirements: z.array(z.object({ id: z.string(), text: z.string(), priority: z.enum(["must", "should", "could"]) })),
  mvpFeatures: z.array(z.string()),
  architecture: z.string(),
  dataModel: z.array(z.object({ entity: z.string(), fields: z.array(z.string()), notes: z.string() })),
  api: z.array(z.object({ method: z.string(), path: z.string(), purpose: z.string() })),
  stack: z.array(z.object({ layer: z.string(), choice: z.string(), why: z.string() })),
  milestones: z.array(
    z.object({
      name: z.string(),
      goal: z.string(),
      duration: z.string(),
      tasks: z.array(z.string()),
    }),
  ),
  testing: z.array(z.string()),
  deployment: z.array(z.string()),
  risks: z.array(z.object({ risk: z.string(), mitigation: z.string() })),
});
export type ProjectPlan = z.infer<typeof ProjectPlanSchema>;

export const ChallengeFeedbackSchema = z.object({
  strengths: z.array(z.string()),
  blindSpots: z.array(z.string()),
  pushFurther: z.string(),
  originality: z.enum(["familiar", "fresh", "surprising"]),
  thinkingPatterns: z.array(z.string()),
});
export type ChallengeFeedback = z.infer<typeof ChallengeFeedbackSchema>;

export const ExplainSchema = z.object({
  summary: z.string(),
  problem: z.string(),
  solution: z.string(),
  insight: z.string(),
  category: z.enum(CATEGORY_SLUGS),
  difficulty: z.enum(DIFFICULTIES),
  buildTime: z.string(),
  stack: z.array(z.string()),
  tags: z.array(z.string()),
  isIdea: z.boolean(),
});
export type Explain = z.infer<typeof ExplainSchema>;

export const ChallengeSchema = z.object({
  title: z.string(),
  prompt: z.string(),
  hints: z.array(z.string()),
  perspectives: z.array(z.object({ title: z.string(), body: z.string() })),
});

const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);
export function clampList(xs: string[], n: number, len = 300) {
  return xs
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, n)
    .map((x) => cut(x, len));
}
export function clampText(s: string, n: number) {
  return cut(s.trim(), n);
}
