import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, Bookmark, Library, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listCollections, listVault } from "@/lib/repo/vault";
import { gymStats, ownedIdeas, profileStats } from "@/lib/repo/workspace";
import { KIND_META, KINDS } from "@/lib/challenges";
import { CATEGORIES } from "@/lib/types";
import { buttonClass, ButtonLink, cx, EmptyState, SectionHeader } from "@/components/ui";
import { IdeaTile } from "@/components/idea-post";

export const metadata: Metadata = { title: "Creativity profile" };

function top(counts: Record<string, number>, n: number) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireUser("/profile");
  const tabParam = (await searchParams).tab;
  const tab = tabParam === "created" || tabParam === "insights" ? tabParam : "saved";
  const s = profileStats(user.id);
  const gym = gymStats(user.id);
  const vault = listVault(user.id);

  // Idea DNA: recurring traits across the ideas you chose to keep.
  const tagCounts: Record<string, number> = {};
  const stackCounts: Record<string, number> = {};
  const diffCounts: Record<string, number> = {};
  for (const v of vault) {
    for (const t of v.idea.tags) tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    for (const t of v.idea.stack) stackCounts[t] = (stackCounts[t] ?? 0) + 1;
    diffCounts[v.idea.difficulty] = (diffCounts[v.idea.difficulty] ?? 0) + 1;
  }
  const maxExplored = Math.max(1, ...Object.values(s.explored));
  const exploredCount = CATEGORIES.filter((c) => s.explored[c.slug]).length;
  const blind = CATEGORIES.filter((c) => !s.explored[c.slug]);
  const weakestKind = [...KINDS].sort((a, b) => (gym.byKind[a] ?? 0) - (gym.byKind[b] ?? 0))[0];


  const created = [...ownedIdeas(user.id, "ai", 30), ...ownedIdeas(user.id, "remix", 30), ...ownedIdeas(user.id, "user", 30)].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const collections = listCollections(user.id);
  const grid = tab === "created" ? created : vault.map((v) => v.idea);
  const TABS = [
    { id: "saved", label: "Saved", icon: Bookmark },
    { id: "created", label: "Created", icon: Sparkles },
    { id: "insights", label: "Insights", icon: BarChart3 },
  ] as const;

  return (
    <div className="mx-auto max-w-[935px]">
      <header className="flex flex-col gap-6 px-1 sm:flex-row sm:items-center sm:gap-12 animate-fade-up">
        <span className="ring-brand mx-auto shrink-0 rounded-full p-[3px] sm:mx-0">
          <span className="bg-brand-warm grid h-28 w-28 place-items-center rounded-full border-4 border-[var(--bg)] text-[42px] font-extrabold sm:h-36 sm:w-36 sm:text-[54px]">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
        </span>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <h1 className="text-[22px] font-bold text-ink">{user.name}</h1>
            <Link href="/settings" className={buttonClass("secondary", "sm")}>
              Edit interests
            </Link>
            <Link href="/vault" className={buttonClass("secondary", "sm")}>
              Open vault
            </Link>
          </div>
          <dl className="mt-5 flex justify-center gap-8 sm:justify-start">
            {[
              ["saved", s.saved],
              ["remixes", s.remixed],
              ["projects", s.projectsStarted],
              ["day streak", gym.current],
            ].map(([label, n]) => (
              <div key={label as string} className="text-center sm:text-left">
                <dd className="text-[18px] font-extrabold text-ink">{n}</dd>
                <dt className="text-[13px] text-ink-2">{label}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[14px] leading-relaxed text-ink-2">
            {s.challenges} thinking workouts · {s.generated} AI concepts · {s.projectsCompleted} shipped
            <br />
            <span className="text-ink-3">Explored {exploredCount} of {CATEGORIES.length} categories</span>
          </p>
        </div>
      </header>

      {collections.length ? (
        <div className="no-scrollbar mt-8 flex gap-5 overflow-x-auto px-1 pb-1">
          {collections.map((c) => (
            <Link key={c.id} href="/vault" className="flex w-[72px] shrink-0 flex-col items-center gap-1.5">
              <span className="glass grid h-[68px] w-[68px] place-items-center rounded-full">
                <Library size={24} className="text-accent" />
              </span>
              <span className="w-full truncate text-center text-[12px] font-semibold text-ink-2">{c.name}</span>
            </Link>
          ))}
        </div>
      ) : null}

      <nav aria-label="Profile sections" className="mt-8 flex justify-center gap-12 border-t border-line">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/profile${t.id === "saved" ? "" : `?tab=${t.id}`}`}
            aria-current={tab === t.id ? "page" : undefined}
            className={cx("-mt-px flex items-center gap-1.5 border-t-2 py-4 text-[12.5px] font-bold tracking-wide", tab === t.id ? "border-[var(--accent)] text-ink" : "border-transparent text-ink-3 hover:text-ink-2")}
          >
            <t.icon size={14} /> {t.label}
          </Link>
        ))}
      </nav>

      {tab !== "insights" ? (
        grid.length ? (
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
            {grid.map((i, n) => (
              <IdeaTile key={i.id} idea={i} index={n} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={tab === "created" ? <Sparkles size={22} /> : <Bookmark size={22} />}
            title={tab === "created" ? "Nothing created yet" : "No saved ideas yet"}
            description={tab === "created" ? "Ideas you generate in the AI Lab, remix, or capture yourself show up here." : "Tap the bookmark on any post to keep it here."}
            action={<ButtonLink href={tab === "created" ? "/lab" : "/discover"}>{tab === "created" ? "Open AI Lab" : "Explore ideas"}</ButtonLink>}
          />
        )
      ) : (
      <div className="mt-4 grid gap-10 lg:grid-cols-2">
        <section>
          <SectionHeader title="Innovation map" description={`You've explored ${exploredCount} of ${CATEGORIES.length} categories.`} />
          <ul className="space-y-1.5">
            {CATEGORIES.map((c) => {
              const n = s.explored[c.slug] ?? 0;
              return (
                <li key={c.slug}>
                  <Link href={`/discover?category=${c.slug}`} className="group grid grid-cols-[150px_1fr_32px] items-center gap-3 text-[13px]">
                    <span className={cx("truncate", n ? "text-ink" : "text-ink-3")}>{c.label}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-surface-3">
                      <span className="block h-full rounded-full bg-accent transition-all group-hover:brightness-110" style={{ width: `${(n / maxExplored) * 100}%` }} />
                    </span>
                    <span className="text-right font-mono text-[11.5px] text-ink-3">{n}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {blind.length ? (
            <p className="mt-5 text-[13.5px] leading-relaxed text-ink-2">
              <span className="font-medium text-ink">Blind spots: </span>
              {blind.slice(0, 4).map((b, i) => (
                <span key={b.slug}>
                  {i ? ", " : ""}
                  <Link href={`/discover?category=${b.slug}`} className="text-accent-text hover:underline">
                    {b.label}
                  </Link>
                </span>
              ))}
              {blind.length > 4 ? ` and ${blind.length - 4} more` : ""}. Great ideas often come from fields you don&apos;t usually look at.
            </p>
          ) : null}
        </section>

        <section>
          <SectionHeader title="Idea DNA" description="What the ideas you keep have in common." />
          {vault.length < 3 ? (
            <p className="text-[14px] text-ink-3">Save at least three ideas to see your patterns.</p>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="mb-2 text-[12.5px] text-ink-3">Recurring themes</p>
                <div className="flex flex-wrap gap-1.5">
                  {top(tagCounts, 10).map(([t, n]) => (
                    <span key={t} className="rounded-full bg-surface-2 px-2.5 py-1 text-[12.5px] text-ink-2">
                      #{t} <span className="text-ink-3">{n}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[12.5px] text-ink-3">Technologies you gravitate to</p>
                <div className="flex flex-wrap gap-1.5">
                  {top(stackCounts, 10).map(([t, n]) => (
                    <span key={t} className="rounded-md border border-line px-2 py-0.5 text-[12.5px] text-ink-2">
                      {t} <span className="text-ink-3">{n}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[12.5px] text-ink-3">Difficulty you choose</p>
                <div className="flex h-3 overflow-hidden rounded-full">
                  {(["beginner", "intermediate", "advanced"] as const).map((d, i) => (
                    <span key={d} title={`${d}: ${diffCounts[d] ?? 0}`} className={cx("h-full", ["bg-success", "bg-accent", "bg-ink"][i])} style={{ width: `${((diffCounts[d] ?? 0) / vault.length) * 100}%` }} />
                  ))}
                </div>
                <p className="mt-1.5 text-[12px] text-ink-3">
                  {(["beginner", "intermediate", "advanced"] as const).map((d) => `${d} ${diffCounts[d] ?? 0}`).join(" · ")}
                </p>
              </div>
            </div>
          )}
        </section>

        <section>
          <SectionHeader title="Thinking habits" description={`${gym.total} exercises across ${gym.activeDays} days · best streak ${gym.best}`} />
          <ul className="space-y-2">
            {KINDS.map((k) => (
              <li key={k} className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-2.5 text-[13.5px]">
                <span className="text-ink">{KIND_META[k].label}</span>
                <span className="font-mono text-ink-2">{gym.byKind[k] ?? 0}</span>
              </li>
            ))}
          </ul>
          <Link href={`/gym?kind=${weakestKind}#library`} className="mt-4 inline-flex items-center gap-1 text-[13.5px] text-accent-text hover:underline">
            Train your least-used muscle: {KIND_META[weakestKind].label} <ArrowRight size={13} />
          </Link>
        </section>

        <section>
          <SectionHeader title="Patterns in your thinking" description="Labels from coach feedback on your exercises." />
          {Object.keys(gym.patterns).length ? (
            <div className="flex flex-wrap gap-2">
              {top(gym.patterns, 12).map(([p, n]) => (
                <span key={p} className="rounded-full bg-accent-soft px-3 py-1 text-[13px] text-accent-text">
                  {p} · {n}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[14px] text-ink-3">Ask for coach feedback after an exercise to start building this picture.</p>
          )}
        </section>
      </div>
      )}
    </div>
  );
}
