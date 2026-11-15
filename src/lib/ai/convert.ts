import "server-only";
import type { NewIdea } from "../repo/ideas";
import type { GeneratedIdea, RemixResult } from "./schemas";

export function generatedToIdea(g: GeneratedIdea, ownerId: string, parentIds: string[] = []): NewIdea {
  return {
    title: g.title,
    summary: g.summary,
    problem: g.problem,
    solution: g.solution,
    insight: g.whyInteresting,
    category: g.category,
    difficulty: g.difficulty,
    buildTime: g.buildTime,
    stack: g.stack,
    tags: g.tags,
    sourceKind: "ai",
    sourceName: "AI Lab",
    creator: null,
    ownerId,
    isPublic: false,
    parentIds,
    details: {
      audience: g.audience,
      alternatives: g.alternatives,
      differentiation: g.differentiation,
      mvp: g.mvp,
      implementation: g.implementation,
      challenges: g.challenges,
      extensions: g.extensions,
    },
  };
}

export function remixToIdea(r: RemixResult, ownerId: string, parentIds: string[]): NewIdea {
  return {
    title: r.title,
    summary: r.summary,
    problem: r.problem,
    solution: r.solution,
    insight: r.whyItWorks,
    category: r.category,
    difficulty: r.difficulty,
    buildTime: r.buildTime,
    stack: r.stack,
    tags: r.tags,
    sourceKind: "remix",
    sourceName: "Remix Engine",
    ownerId,
    isPublic: false,
    parentIds,
    details: {
      audience: r.audience,
      combined: r.combined,
      whyItWorks: r.whyItWorks,
      opportunity: r.opportunity,
      differentiation: r.differentiation,
      feasibility: `${r.feasibilityRating.toUpperCase()} — ${r.feasibility}`,
      prototype: r.prototype,
    },
  };
}
