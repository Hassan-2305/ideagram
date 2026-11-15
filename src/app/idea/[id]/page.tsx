import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Hammer, Shuffle } from "lucide-react";
import { getUser } from "@/lib/auth";
import { getIdea, recordInteraction, relatedIdeas, userStates } from "@/lib/repo/ideas";
import { lineage } from "@/lib/repo/workspace";
import { categoryLabel, type Idea } from "@/lib/types";
import { IdeaCard, Meta, SourceTag } from "@/components/idea-card";
import { ButtonLink, Eyebrow } from "@/components/ui";
import { DetailActions, SimilarIdeas, AddToRemix } from "./client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await getUser();
  const idea = getIdea(id, user?.id ?? null);
  return idea ? { title: idea.title, description: idea.summary } : { title: "Idea not found" };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-7">
      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">{title}</h2>
      <div className="text-[16px] leading-[1.7] text-ink-2">{children}</div>
    </section>
  );
}

function List({ items, ordered }: { items: string[]; ordered?: boolean }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className="space-y-2">
      {items.map((x, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-[3px] shrink-0 font-mono text-[12px] text-ink-3">{ordered ? String(i + 1).padStart(2, "0") : "—"}</span>
          <span>{x}</span>
        </li>
      ))}
    </Tag>
  );
}

type Tree = { idea: Idea; parents: Tree[] };
function Lineage({ tree, depth = 0 }: { tree: Tree; depth?: number }) {
  return (
    <div className={depth ? "ml-5 border-l border-line pl-4" : ""}>
      <Link href={`/idea/${tree.idea.id}`} className="group flex items-center gap-2 py-1.5 text-[14px]">
        <span className={depth ? "text-ink-2 group-hover:text-ink" : "font-medium text-ink"}>{tree.idea.title}</span>
        <span className="font-mono text-[11px] text-ink-3">{tree.idea.sourceKind === "remix" ? "remix" : categoryLabel(tree.idea.category)}</span>
      </Link>
      {tree.parents.map((p) => (
        <Lineage key={p.idea.id} tree={p} depth={depth + 1} />
      ))}
    </div>
  );
}

export default async function IdeaPage({ params }: Props) {
  const { id } = await params;
  const user = await getUser();
  const idea = getIdea(id, user?.id ?? null);
  if (!idea) notFound();
  if (user) recordInteraction(user.id, idea.id, "view");

  const d = idea.details ?? {};
  const related = relatedIdeas(idea, user?.id ?? null, 3);
  const states = userStates(user?.id ?? null, [idea.id, ...related.map((r) => r.id)]);
  const tree = idea.parentIds.length && user ? lineage(idea.id, user.id) : null;
  const external = idea.sourceKind === "hackernews" || idea.sourceKind === "github";
  const sourceText = d.implementation === "source-text";

  return (
    <article className="mx-auto max-w-3xl">
      <Link href="/discover" className="mb-8 inline-flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-ink">
        <ArrowLeft size={14} /> Discover
      </Link>

      <header className="animate-fade-up">
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/discover?category=${idea.category}`} className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent-text hover:underline">
            {categoryLabel(idea.category)}
          </Link>
          <Meta idea={idea} />
        </div>
        <h1 className="mt-4 font-serif text-[2.6rem] leading-[1.04] text-ink md:text-[3.4rem]">{idea.title}</h1>
        <p className="mt-5 text-[19px] leading-relaxed text-ink-2">{idea.summary}</p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <SourceTag idea={idea} className="text-[13px]" />
          <DetailActions idea={idea} state={states[idea.id]} />
        </div>
      </header>

      {idea.insight ? (
        <blockquote className="my-10 border-l-2 border-accent pl-6 font-serif text-[1.65rem] italic leading-snug text-ink">{idea.insight}</blockquote>
      ) : (
        <div className="h-8" />
      )}

      {idea.problem ? <Section title="The problem">{idea.problem}</Section> : null}
      {d.audience ? <Section title="Who it's for">{d.audience}</Section> : null}
      {idea.solution ? <Section title="The approach">{idea.solution}</Section> : null}

      {d.combined?.length ? (
        <Section title="What was combined">
          <List items={d.combined} />
          {d.whyItWorks ? <p className="mt-4">{d.whyItWorks}</p> : null}
        </Section>
      ) : null}
      {d.opportunity ? <Section title="The new opportunity">{d.opportunity}</Section> : null}
      {d.alternatives?.length ? (
        <Section title="What exists today">
          <List items={d.alternatives} />
        </Section>
      ) : null}
      {d.differentiation ? <Section title="What makes it different">{d.differentiation}</Section> : null}
      {d.feasibility ? <Section title="Feasibility">{d.feasibility}</Section> : null}
      {d.mvp?.length ? (
        <Section title="MVP scope">
          <List items={d.mvp} ordered />
        </Section>
      ) : null}
      {d.prototype?.length ? (
        <Section title="How to prototype it">
          <List items={d.prototype} ordered />
        </Section>
      ) : null}
      {d.implementation && d.implementation !== "source-text" && d.implementation !== "ai-explained" ? <Section title="Technical implementation">{d.implementation}</Section> : null}
      {idea.stack.length ? (
        <Section title="Suggested stack">
          <div className="flex flex-wrap gap-2">
            {idea.stack.map((s) => (
              <span key={s} className="rounded-lg border border-line bg-surface px-2.5 py-1 text-[13px] text-ink">
                {s}
              </span>
            ))}
          </div>
        </Section>
      ) : null}
      {d.challenges?.length ? (
        <Section title="Hard parts & risks">
          <List items={d.challenges} />
        </Section>
      ) : null}
      {d.extensions?.length ? (
        <Section title="Where it could go next">
          <List items={d.extensions} />
        </Section>
      ) : null}

      {external || idea.sourceUrl ? (
        <Section title="Original source">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-[15px] text-ink">
              {idea.sourceName}
              {idea.creator ? <> · by {idea.creator}</> : null}
              {idea.publishedAt ? <span className="text-ink-3"> · {new Date(idea.publishedAt).toLocaleDateString("en", { dateStyle: "medium" })}</span> : null}
            </p>
            {idea.sourceUrl ? (
              <a href={idea.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="mt-2 inline-flex items-center gap-1 text-[14px] text-accent-text hover:underline">
                View on {idea.sourceName} <ArrowUpRight size={14} />
              </a>
            ) : null}
            <p className="mt-3 text-[12.5px] leading-relaxed text-ink-3">
              {sourceText
                ? "The summary above is the creator's own description from the source. All rights remain with the original author."
                : "The explanation above was written by AI from the source's public description. Check the original for accuracy; all rights remain with the original author."}
            </p>
          </div>
        </Section>
      ) : null}

      {tree ? (
        <Section title="Idea evolution">
          <p className="mb-3 text-[14px] text-ink-3">How this idea was built from earlier ones.</p>
          <Lineage tree={tree} />
        </Section>
      ) : null}

      <section className="mt-4 grid gap-3 rounded-2xl border border-line bg-bg-elev p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Eyebrow>Take it further</Eyebrow>
        </div>
        <ButtonLink href={`/build/new?idea=${idea.id}`} size="lg" className="justify-start">
          <Hammer size={16} /> Build this idea
        </ButtonLink>
        <AddToRemix idea={{ id: idea.id, title: idea.title, category: idea.category }} />
        <Link href={`/remix?ids=${idea.id}`} className="flex items-center gap-2 text-[13px] text-ink-3 hover:text-ink sm:col-span-2">
          <Shuffle size={13} /> Or remix it with a concept of your own
        </Link>
      </section>

      <div id="similar" className="scroll-mt-24">
        <SimilarIdeas ideaId={idea.id} />
      </div>

      {related.length ? (
        <section className="mt-14">
          <h2 className="mb-4 text-[17px] font-semibold text-ink">Related in the library</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r, i) => (
              <IdeaCard key={r.id} idea={r} state={states[r.id]} index={i} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
