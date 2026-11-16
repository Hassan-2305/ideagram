import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getUser } from "@/lib/auth";
import { getChallenge, KIND_META } from "@/lib/challenges";
import { listSubmissions } from "@/lib/repo/workspace";
import { categoryLabel } from "@/lib/types";
import { Exercise } from "./exercise";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = getChallenge((await params).slug);
  return { title: c ? c.title : "Exercise" };
}

export default async function ExercisePage({ params }: Props) {
  const { slug } = await params;
  const c = getChallenge(slug);
  if (!c) notFound();
  const user = await getUser();
  const past = user ? listSubmissions(user.id, 200).filter((s) => s.challengeSlug === slug) : [];

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/gym" className="mb-8 inline-flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-ink">
        <ArrowLeft size={14} /> Thinking Gym
      </Link>
      <header className="animate-fade-up">
        <p className="text-[12px] font-semibold text-accent-text">
          {KIND_META[c.kind].label} · {categoryLabel(c.category)}
        </p>
        <h1 className="mt-4 font-serif text-[2.5rem] leading-[1.05] text-ink md:text-[3.2rem]">{c.title}</h1>
      </header>

      <div className="mt-8 rounded-3xl border border-line bg-surface p-6 md:p-8">
        {c.kind === "connect-the-dots" && c.conceptA && c.conceptB ? (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="rounded-2xl bg-surface-2 px-4 py-2.5 font-serif text-2xl text-ink">{c.conceptA}</span>
            <span className="font-mono text-ink-3">+</span>
            <span className="rounded-2xl bg-surface-2 px-4 py-2.5 font-serif text-2xl text-ink">{c.conceptB}</span>
          </div>
        ) : null}
        {c.kind === "reverse-engineer" && c.product ? <p className="mb-4 font-serif text-3xl text-ink">{c.product}</p> : null}
        <p className="text-[17px] leading-relaxed text-ink">{c.prompt}</p>
        {c.constraints?.length ? (
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {c.constraints.map((x) => (
              <li key={x} className="rounded-xl border border-dashed border-line-strong px-3.5 py-2.5 text-[14px] text-ink-2">
                {x}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <Exercise
        challenge={{ slug: c.slug, kind: c.kind, title: c.title, hints: c.hints, questions: c.questions ?? [], category: c.category }}
        signedIn={!!user}
        past={past.map((p) => ({ id: p.id, response: p.response, createdAt: p.createdAt, feedback: p.feedback }))}
      />
    </div>
  );
}
