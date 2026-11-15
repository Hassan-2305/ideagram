import { describe, expect, it } from "vitest";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as S from "@/lib/ai/schemas";

describe("AI structured-output schemas", () => {
  const schemas = {
    generate: S.GenerateResultSchema,
    remix: S.RemixResultSchema,
    hackathon: S.HackathonResultSchema,
    plan: S.ProjectPlanSchema,
    feedback: S.ChallengeFeedbackSchema,
    explain: S.ExplainSchema,
  };
  for (const [name, schema] of Object.entries(schemas)) {
    it(`${name} converts to a JSON schema output format`, () => {
      const fmt = betaZodOutputFormat(schema) as unknown as { type: string; schema: Record<string, unknown> };
      expect(fmt.type).toBe("json_schema");
      expect(JSON.stringify(fmt.schema)).toContain('"type":"object"');
    });
  }
  it("rejects malformed model output", () => {
    expect(S.ChallengeFeedbackSchema.safeParse({ strengths: "x" }).success).toBe(false);
  });
  it("clamps long text", () => {
    expect(S.clampText("a".repeat(50), 10)).toHaveLength(10);
    expect(S.clampList(["", " a ", "b", "c"], 2)).toEqual(["a", "b"]);
  });
});
