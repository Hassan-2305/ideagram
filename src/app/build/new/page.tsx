import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getIdea } from "@/lib/repo/ideas";
import { listProjects } from "@/lib/repo/workspace";
import { categoryLabel } from "@/lib/types";
import { Meta } from "@/components/idea-card";
import { AiNotice } from "@/components/ai-notice";
import { NewPlanForm } from "./form";

export const metadata: Metadata = { title: "Plan a project" };

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<{ idea?: string }> }) {
  const { idea: ideaId } = await searchParams;
  const user = await requireUser(`/build/new${ideaId ? `?idea=${ideaId}` : ""}`);
  const idea = ideaId ? getIdea(ideaId, user.id) : null;
  if (!idea) redirect("/build");
  const existing = listProjects(user.id).find((p) => p.ideaId === idea.id);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/build" className="mb-8 inline-flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-ink">
        <ArrowLeft size={14} /> Build Mode
      </Link>
      <p className="text-[12px] font-semibold text-accent-text">Build this idea</p>
      <h1 className="mt-3 font-serif text-[2.4rem] leading-[1.05] text-ink">{idea.title}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="text-[12px] font-semibold text-ink-3">{categoryLabel(idea.category)}</span>
        <Meta idea={idea} />
      </div>
      <p className="mt-4 text-[15.5px] leading-relaxed text-ink-2">{idea.summary}</p>
      <div className="mt-8">
        <AiNotice feature="Plan generation" />
        {existing ? (
          <p className="mb-4 rounded-xl bg-surface-2 px-4 py-3 text-[14px] text-ink-2">
            You already have a plan for this idea —{" "}
            <Link href={`/build/${existing.id}`} className="font-medium text-ink underline-offset-2 hover:underline">
              open “{existing.title}”
            </Link>
            . Generating again creates a separate project.
          </p>
        ) : null}
        <NewPlanForm ideaId={idea.id} />
      </div>
    </div>
  );
}
