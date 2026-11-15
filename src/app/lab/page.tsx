import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { userStates } from "@/lib/repo/ideas";
import { ownedIdeas } from "@/lib/repo/workspace";
import { PageHeader } from "@/components/ui";
import { AiNotice } from "@/components/ai-notice";
import { LabWorkspace } from "./workspace";

export const metadata: Metadata = { title: "AI Lab" };

export default async function LabPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const user = await requireUser("/lab");
  const { topic } = await searchParams;
  const history = ownedIdeas(user.id, "ai", 12);
  return (
    <>
      <PageHeader
        eyebrow="AI Lab"
        title="Generate ideas shaped to you"
        description="Describe your situation — topic, skills, time, constraints — and pick a style. Every idea comes with the problem, audience, alternatives, MVP scope, stack and risks."
      />
      <AiNotice feature="Idea generation" />
      <LabWorkspace initialTopic={topic?.slice(0, 200) ?? ""} history={history} historyStates={userStates(user.id, history.map((h) => h.id))} />
    </>
  );
}
