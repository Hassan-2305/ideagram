import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listVault } from "@/lib/repo/vault";
import { gymStats, profileStats } from "@/lib/repo/workspace";
import { KIND_META, KINDS } from "@/lib/challenges";
import { CATEGORIES } from "@/lib/types";
import { Card, cx, PageHeader, SectionHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Creativity profile" };

function top(counts: Record<string, number>, n: number) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

export default async function ProfilePage() {
  const user = await requireUser("/profile");
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

  const metrics = [
    ["Ideas saved", s.saved],
    ["Ideas remixed", s.remixed],
    ["AI concepts", s.generated],
    ["Exercises done", s.challenges],
    ["Projects started", s.projectsStarted],
    ["Projects shipped", s.projectsCompleted],
  ] as const;

  return (
    <>
      <PageHeader
        eyebrow="Creativity profile"
        title={user.name}
        description="A picture of how you explore and think — measured by ideas kept, remixed and built, not by time spent."
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {metrics.map(([label, n]) => (
          <Card key={label} className="p-4">
            <p className="font-serif text-4xl leading-none text-ink">{n}</p>
            <p className="mt-2 text-[12.5px] text-ink-3">{label}</p>
          </Card>
        ))}
      </section>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
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
    </>
  );
}
