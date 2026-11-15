import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Flame } from "lucide-react";
import { getUser } from "@/lib/auth";
import { gymStats, listSubmissions } from "@/lib/repo/workspace";
import { CHALLENGES, dailyChallenge, getChallenge, KIND_META, KINDS, suggestNext } from "@/lib/challenges";
import { categoryLabel } from "@/lib/types";
import { Card, cx, PageHeader, SectionHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Thinking Gym" };

export default async function GymPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const user = await getUser();
  const { kind } = await searchParams;
  const today = dailyChallenge();
  const stats = user ? gymStats(user.id) : null;
  const subs = user ? listSubmissions(user.id, 6) : [];
  const done = new Set(stats?.completedSlugs ?? []);
  const next = stats ? suggestNext(stats.completedSlugs, stats.byKind) : undefined;
  const activeKind = KINDS.includes(kind as never) ? (kind as (typeof KINDS)[number]) : null;
  const library = CHALLENGES.filter((c) => !activeKind || c.kind === activeKind);
  const topPatterns = Object.entries(stats?.patterns ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <>
      <PageHeader
        eyebrow="Thinking Gym"
        title="Train the muscle behind good ideas"
        description="Short exercises that make you think before you see answers. Write your approach, then compare it with other perspectives and get specific feedback."
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <Link href={`/gym/${today.slug}`} className="group flex flex-col rounded-3xl bg-ink p-7 text-bg shadow-card transition hover:shadow-float lg:col-span-2 md:p-9">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] opacity-60">Today · {KIND_META[today.kind].label}</p>
          <h2 className="mt-4 font-serif text-[2.2rem] leading-[1.08] md:text-[2.6rem]">{today.title}</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed opacity-75">{today.prompt}</p>
          <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[14px] font-medium">
            {done.has(today.slug) ? (
              <>
                <Check size={15} className="text-accent" /> Completed — revisit
              </>
            ) : (
              <>
                Start today&apos;s challenge <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </span>
        </Link>
        <Card className="flex flex-col p-6">
          {stats ? (
            <>
              <div className="flex items-center gap-3">
                <div className={cx("grid h-12 w-12 place-items-center rounded-2xl", stats.current ? "bg-accent-soft text-accent-text" : "bg-surface-2 text-ink-3")}>
                  <Flame size={22} />
                </div>
                <div>
                  <p className="font-serif text-3xl leading-none text-ink">{stats.current}</p>
                  <p className="mt-1 text-[12.5px] text-ink-3">day streak · best {stats.best}</p>
                </div>
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl bg-bg-elev p-3">
                  <dt className="text-[11.5px] text-ink-3">Exercises</dt>
                  <dd className="font-mono text-lg text-ink">{stats.total}</dd>
                </div>
                <div className="rounded-xl bg-bg-elev p-3">
                  <dt className="text-[11.5px] text-ink-3">Active days</dt>
                  <dd className="font-mono text-lg text-ink">{stats.activeDays}</dd>
                </div>
              </dl>
              {topPatterns.length ? (
                <div className="mt-5">
                  <p className="text-[12px] text-ink-3">Your thinking patterns</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {topPatterns.map(([p, n]) => (
                      <span key={p} className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[12px] text-ink-2">
                        {p} · {n}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {next && next.slug !== today.slug ? (
                <Link href={`/gym/${next.slug}`} className="mt-auto flex items-center justify-between gap-2 pt-5 text-[13px] text-ink-2 hover:text-ink">
                  <span className="min-w-0 truncate">
                    Up next: <span className="font-medium text-ink">{next.title}</span>
                  </span>
                  <ArrowRight size={14} />
                </Link>
              ) : null}
            </>
          ) : (
            <div className="my-auto">
              <p className="font-semibold text-ink">Track your streak</p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">You can read every exercise without an account. Sign in to submit answers, keep a thinking log and get AI feedback.</p>
              <Link href="/signup?next=/gym" className="mt-4 inline-flex items-center gap-1 text-[14px] font-medium text-accent-text hover:underline">
                Create a free account <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </Card>
      </section>

      <section className="mt-14">
        <SectionHeader title="Five ways to think" description="Mix them — each trains a different part of creative thinking." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {KINDS.map((k) => (
            <Link
              key={k}
              href={activeKind === k ? "/gym" : `/gym?kind=${k}#library`}
              aria-pressed={activeKind === k}
              className={cx("rounded-2xl border p-4 transition", activeKind === k ? "border-ink bg-surface shadow-soft" : "border-line bg-surface hover:border-line-strong")}
            >
              <p className="text-[14.5px] font-semibold text-ink">{KIND_META[k].label}</p>
              <p className="mt-1 text-[12.5px] leading-snug text-ink-3">{KIND_META[k].blurb}</p>
              {stats ? <p className="mt-3 font-mono text-[11px] text-ink-3">{stats.byKind[k] ?? 0} done</p> : null}
            </Link>
          ))}
        </div>
      </section>

      <section id="library" className="mt-14 scroll-mt-20">
        <SectionHeader title={activeKind ? KIND_META[activeKind].label : "All exercises"} description={`${library.length} exercises`} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {library.map((c) => (
            <Link key={c.slug} href={`/gym/${c.slug}`} className="group flex flex-col rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">{KIND_META[c.kind].label}</span>
                {done.has(c.slug) ? (
                  <span className="inline-flex items-center gap-1 text-[11.5px] text-success">
                    <Check size={12} /> Done
                  </span>
                ) : null}
              </div>
              <p className="mt-3 font-semibold leading-snug text-ink group-hover:text-accent-text">{c.title}</p>
              <p className="mt-1.5 line-clamp-3 text-[13.5px] leading-relaxed text-ink-2">{c.prompt}</p>
              <p className="mt-auto pt-3 text-[11.5px] text-ink-3">{categoryLabel(c.category)}</p>
            </Link>
          ))}
        </div>
      </section>

      {subs.length ? (
        <section className="mt-14">
          <SectionHeader title="Your thinking log" />
          <ul className="space-y-2">
            {subs.map((s) => (
              <li key={s.id}>
                <Link href={`/gym/${s.challengeSlug}`} className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-4 hover:border-line-strong">
                  <span className="w-14 shrink-0 font-mono text-[11px] text-ink-3">{new Date(s.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-medium text-ink">{getChallenge(s.challengeSlug)?.title ?? s.challengeSlug}</span>
                    <span className="mt-0.5 line-clamp-2 block text-[13px] text-ink-2">{s.response}</span>
                  </span>
                  {s.feedback ? <span className="shrink-0 rounded-md bg-surface-2 px-2 py-0.5 font-mono text-[10.5px] uppercase text-ink-3">{s.feedback.originality}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
