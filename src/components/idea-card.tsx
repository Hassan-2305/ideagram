"use client";

import Link from "next/link";
import { useState } from "react";
import { Clock, Compass, Gauge, GitBranch, MessageSquare, PenLine, Shuffle, Sparkles, User } from "lucide-react";
import { categoryLabel, type Idea } from "@/lib/types";
import { IdeaActionBar, type IdeaState } from "./idea-actions";
import { Badge, cx } from "./ui";

export type CardVariant = "compact" | "detailed" | "editorial";

const SOURCE_ICON = {
  editorial: PenLine,
  hackernews: MessageSquare,
  github: GitBranch,
  ai: Sparkles,
  remix: Shuffle,
  user: User,
} as const;

export function SourceTag({ idea, className }: { idea: Pick<Idea, "sourceKind" | "sourceName" | "creator">; className?: string }) {
  const Icon = SOURCE_ICON[idea.sourceKind] ?? PenLine;
  const label =
    idea.sourceKind === "ai" ? "Generated for you" : idea.sourceKind === "remix" ? "Your remix" : idea.creator && idea.sourceKind !== "editorial" ? `${idea.sourceName} · ${idea.creator}` : idea.sourceName;
  return (
    <span className={cx("inline-flex min-w-0 items-center gap-1.5 text-[12px] text-ink-3", className)}>
      <Icon size={13} className="shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}

export function Meta({ idea }: { idea: Pick<Idea, "difficulty" | "buildTime"> }) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-wide text-ink-3">
      <span className="inline-flex items-center gap-1">
        <Gauge size={12} /> {idea.difficulty}
      </span>
      {idea.buildTime ? (
        <span className="inline-flex items-center gap-1">
          <Clock size={12} /> {idea.buildTime}
        </span>
      ) : null}
    </span>
  );
}

const REASON_LABEL: Record<string, string> = { explore: "Blind spot", fresh: "New" };

export function IdeaCard({
  idea,
  state,
  variant = "compact",
  reason,
  index = 0,
}: {
  idea: Idea;
  state: IdeaState;
  variant?: CardVariant;
  reason?: string;
  index?: number;
}) {
  const [gone, setGone] = useState(false);
  if (gone) return null;
  const href = `/idea/${idea.id}`;
  const reasonLabel = reason ? REASON_LABEL[reason] : undefined;

  if (variant === "editorial") {
    return (
      <article className="group border-b border-line py-10 first:pt-2 animate-fade-up" style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent-text">{categoryLabel(idea.category)}</span>
          {reasonLabel ? <Badge tone={reason === "explore" ? "accent" : "neutral"}>{reasonLabel === "Blind spot" ? <Compass size={11} /> : null}{reasonLabel}</Badge> : null}
          <Meta idea={idea} />
        </div>
        <Link href={href} className="block">
          <h2 className="max-w-3xl font-serif text-[2rem] leading-[1.08] text-ink transition-colors group-hover:text-accent-text md:text-[2.5rem]">{idea.title}</h2>
        </Link>
        <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-ink-2">{idea.summary}</p>
        {idea.insight ? (
          <blockquote className="mt-6 max-w-2xl border-l-2 border-accent pl-5 font-serif text-xl italic leading-snug text-ink">{idea.insight}</blockquote>
        ) : null}
        {idea.problem ? (
          <div className="mt-6 grid max-w-3xl gap-6 text-[15px] leading-relaxed md:grid-cols-2">
            <div>
              <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-3">The problem</p>
              <p className="text-ink-2">{idea.problem}</p>
            </div>
            {idea.solution ? (
              <div>
                <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-3">The approach</p>
                <p className="text-ink-2">{idea.solution}</p>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="mt-6 flex items-center justify-between gap-3">
          <SourceTag idea={idea} />
          <IdeaActionBar idea={idea} initial={state} onHidden={() => setGone(true)} size="md" />
        </div>
      </article>
    );
  }

  const detailed = variant === "detailed";
  return (
    <article
      className="group relative flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-soft transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">{categoryLabel(idea.category)}</span>
        {reasonLabel ? (
          <Badge tone={reason === "explore" ? "accent" : "neutral"}>
            {reason === "explore" ? <Compass size={11} /> : null}
            {reasonLabel}
          </Badge>
        ) : null}
      </div>
      <Link href={href} className="block after:absolute after:inset-0 after:rounded-2xl" aria-label={idea.title}>
        <h3 className="text-[17px] font-semibold leading-snug tracking-tight text-ink">{idea.title}</h3>
      </Link>
      <p className={cx("mt-2 text-[14px] leading-relaxed text-ink-2", !detailed && "line-clamp-3")}>{idea.summary}</p>
      {detailed && idea.problem ? (
        <div className="mt-4 space-y-3 text-[13.5px] leading-relaxed">
          <p className="text-ink-2">
            <span className="font-medium text-ink">Problem. </span>
            {idea.problem}
          </p>
          {idea.insight ? (
            <p className="rounded-xl bg-surface-2 px-3.5 py-2.5 text-ink-2">
              <span className="font-medium text-accent-text">Why it matters. </span>
              {idea.insight}
            </p>
          ) : null}
        </div>
      ) : null}
      {idea.stack.length ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {idea.stack.slice(0, detailed ? 6 : 3).map((s) => (
            <span key={s} className="rounded-md border border-line px-1.5 py-0.5 text-[11.5px] text-ink-2">
              {s}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-auto pt-4">
        <Meta idea={idea} />
        <div className="relative z-10 mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
          <SourceTag idea={idea} />
          <IdeaActionBar idea={idea} initial={state} onHidden={() => setGone(true)} />
        </div>
      </div>
    </article>
  );
}

export function IdeaCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-surface p-5">
      <div className="skeleton h-3 w-24" />
      <div className="skeleton mt-4 h-5 w-4/5" />
      <div className="skeleton mt-3 h-3.5 w-full" />
      <div className="skeleton mt-2 h-3.5 w-11/12" />
      <div className="skeleton mt-2 h-3.5 w-2/3" />
      <div className="mt-6 flex gap-2">
        <div className="skeleton h-5 w-14" />
        <div className="skeleton h-5 w-16" />
      </div>
      <div className="skeleton mt-5 h-8 w-full" />
    </div>
  );
}
