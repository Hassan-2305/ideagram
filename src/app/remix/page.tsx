import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getIdeas } from "@/lib/repo/ideas";
import { listVault } from "@/lib/repo/vault";
import { listRemixes } from "@/lib/repo/workspace";
import { PageHeader } from "@/components/ui";
import { AiNotice } from "@/components/ai-notice";
import { RemixStudio } from "./studio";

export const metadata: Metadata = { title: "Remix" };

export default async function RemixPage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const user = await requireUser("/remix");
  const { ids } = await searchParams;
  const selected = getIdeas((ids ?? "").split(",").filter(Boolean).slice(0, 4), user.id);
  const library = listVault(user.id).map((v) => ({ id: v.idea.id, title: v.idea.title, category: v.idea.category, sourceKind: v.idea.sourceKind }));
  const history = listRemixes(user.id, 20).map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    instruction: r.instruction,
    inputs: r.inputs.map((i) => ({ id: i.id, title: i.title })),
    result: { id: r.result.id, title: r.result.title, summary: r.result.summary, category: r.result.category },
  }));
  return (
    <>
      <PageHeader
        eyebrow="Remix Engine"
        title="Combine ideas into new ones"
        description="Pick up to four ideas or concepts. The engine looks for a structural connection — shared data, a borrowed interaction, a transplanted business model — and explains why the combination could work."
      />
      <AiNotice feature="The remix engine" />
      <RemixStudio initial={selected.map((i) => ({ id: i.id, title: i.title, category: i.category }))} library={library} history={history} />
    </>
  );
}
