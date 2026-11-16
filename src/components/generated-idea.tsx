"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, ChevronDown, Hammer } from "lucide-react";
import { categoryLabel, type Idea } from "@/lib/types";
import { IdeaActionBar, type IdeaState } from "./idea-actions";
import { Meta } from "./idea-card";
import { buttonClass, cx } from "./ui";

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-semibold text-ink-3">{label}</p>
      <div className="text-[14px] leading-relaxed text-ink-2">{children}</div>
    </div>
  );
}

const Bullets = ({ items }: { items: string[] }) => (
  <ul className="space-y-1">
    {items.map((x, i) => (
      <li key={i} className="flex gap-2">
        <span className="text-ink-3">—</span>
        {x}
      </li>
    ))}
  </ul>
);

/** Full structured view of an AI-generated idea, expandable in place. */
export function GeneratedIdeaCard({ idea, state, index = 0, defaultOpen = false }: { idea: Idea; state: IdeaState; index?: number; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const d = idea.details ?? {};
  return (
    <article className="rounded-2xl border border-line bg-surface shadow-soft animate-fade-up" style={{ animationDelay: `${index * 70}ms` }}>
      <div className="p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[12px] font-semibold text-accent-text">{categoryLabel(idea.category)}</span>
          <Meta idea={idea} />
        </div>
        <h3 className="mt-3 font-serif text-[1.7rem] leading-[1.12] text-ink">{idea.title}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{idea.summary}</p>
        {idea.insight ? (
          <p className="mt-4 rounded-xl bg-surface-2 px-4 py-3 text-[14px] leading-relaxed text-ink-2">
            <span className="font-medium text-ink">Why it&apos;s interesting. </span>
            {idea.insight}
          </p>
        ) : null}
        {open ? (
          <div className="mt-6 grid gap-6 border-t border-line pt-6 md:grid-cols-2">
            <Block label="Problem">{idea.problem}</Block>
            {d.audience ? <Block label="Target audience">{d.audience}</Block> : null}
            <Block label="Proposed solution">{idea.solution}</Block>
            {d.differentiation ? <Block label="Differentiation">{d.differentiation}</Block> : null}
            {d.alternatives?.length ? (
              <Block label="Existing alternatives">
                <Bullets items={d.alternatives} />
              </Block>
            ) : null}
            {d.mvp?.length ? (
              <Block label="MVP scope">
                <Bullets items={d.mvp} />
              </Block>
            ) : null}
            {d.implementation ? (
              <div className="md:col-span-2">
                <Block label="Technical implementation">{d.implementation}</Block>
              </div>
            ) : null}
            {d.challenges?.length ? (
              <Block label="Potential challenges">
                <Bullets items={d.challenges} />
              </Block>
            ) : null}
            {d.extensions?.length ? (
              <Block label="Future extensions">
                <Bullets items={d.extensions} />
              </Block>
            ) : null}
          </div>
        ) : null}
        {idea.stack.length ? (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {idea.stack.map((s) => (
              <span key={s} className="rounded-md border border-line px-2 py-0.5 text-[12px] text-ink-2">
                {s}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2 md:px-4">
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className={buttonClass("ghost", "sm")}>
          <ChevronDown size={15} className={cx("transition-transform", open && "rotate-180")} />
          {open ? "Less" : "Full breakdown"}
        </button>
        <div className="flex items-center gap-1">
          <Link href={`/idea/${idea.id}`} className={buttonClass("ghost", "sm")}>
            Open <ArrowUpRight size={14} />
          </Link>
          <Link href={`/build/new?idea=${idea.id}`} className={buttonClass("ghost", "sm")}>
            <Hammer size={14} /> Build
          </Link>
          <IdeaActionBar idea={idea} initial={state} />
        </div>
      </div>
    </article>
  );
}
