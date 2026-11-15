import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listHackathonSessions } from "@/lib/repo/workspace";
import { PageHeader } from "@/components/ui";
import { AiNotice } from "@/components/ai-notice";
import { HackathonWizard } from "./wizard";

export const metadata: Metadata = { title: "Hackathon Mode" };

export default async function HackathonPage() {
  const user = await requireUser("/hackathon");
  const sessions = listHackathonSessions(user.id);
  return (
    <>
      <PageHeader
        eyebrow="Hackathon Mode"
        title={<>Blank mind? Ship anyway.</>}
        description="Answer a few questions about the event and your team. You'll get feasible project ideas ranked on explainable criteria, each with a roadmap, task split, demo plan, judge Q&A and a fallback."
      />
      <AiNotice feature="Hackathon Mode" />
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <HackathonWizard />
        <aside>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">Past sessions</p>
          {sessions.length ? (
            <ul className="space-y-2">
              {sessions.map((s) => (
                <li key={s.id}>
                  <Link href={`/hackathon/${s.id}`} className="group flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 transition hover:border-line-strong">
                    <Trophy size={15} className="shrink-0 text-ink-3" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-ink">{s.title}</span>
                      <span className="block text-[11.5px] text-ink-3">{new Date(s.createdAt).toLocaleDateString("en", { dateStyle: "medium" })}</span>
                    </span>
                    <ArrowRight size={14} className="text-ink-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] leading-relaxed text-ink-3">Your sessions will be saved here so you can revisit the shortlist during the event.</p>
          )}
          <div className="mt-6 rounded-2xl border border-line bg-bg-elev p-4 text-[12.5px] leading-relaxed text-ink-2">
            <p className="font-medium text-ink">How ranking works</p>
            <p className="mt-1">Each idea is scored 1–10 on theme relevance, feasibility for your hours and skills, novelty, demo potential, problem significance, time fit and differentiation — with a reason for every score. Rankings are guidance, not a promise of winning.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
