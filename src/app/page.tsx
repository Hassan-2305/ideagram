import Link from "next/link";
import { ArrowRight, Compass, Dumbbell, Flame, FlaskConical, Hammer, Library, Shuffle, Trophy } from "lucide-react";
import { getUser } from "@/lib/auth";
import { featuredIdea, getFeed, getSignals } from "@/lib/repo/feed";
import { userStates } from "@/lib/repo/ideas";
import { recentSaves } from "@/lib/repo/vault";
import { gymStats, listProjects, ownedIdeas, profileStats } from "@/lib/repo/workspace";
import { computeAffinity } from "@/lib/recommend";
import { dailyChallenge, KIND_META } from "@/lib/challenges";
import { refreshInBackground } from "@/lib/ingest";
import { CATEGORIES, categoryLabel, type Idea } from "@/lib/types";
import { IdeaCard, Meta, SourceTag } from "@/components/idea-card";
import { ButtonLink, Card, Eyebrow, SectionHeader } from "@/components/ui";

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Still up" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Featured({ idea, saved }: { idea: Idea; saved?: boolean }) {
  return (
    <Link
      href={`/idea/${idea.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface p-7 shadow-soft transition hover:border-line-strong hover:shadow-card md:p-9"
    >
      <div className="flex items-center justify-between">
        <Eyebrow className="text-accent-text">Idea of the day · {categoryLabel(idea.category)}</Eyebrow>
        {saved ? <span className="text-[12px] text-ink-3">In your vault</span> : null}
      </div>
      <h2 className="mt-5 max-w-2xl font-serif text-[2.1rem] leading-[1.06] text-ink transition-colors group-hover:text-accent-text md:text-[2.7rem]">{idea.title}</h2>
      <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-ink-2">{idea.summary}</p>
      {idea.insight ? <p className="mt-5 max-w-2xl border-l-2 border-accent pl-4 font-serif text-lg italic leading-snug text-ink">{idea.insight}</p> : null}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-7">
        <Meta idea={idea} />
        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink">
          Read the idea <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function ChallengeCard({ done, streak }: { done?: boolean; streak?: number }) {
  const c = dailyChallenge();
  return (
    <Link href={`/gym/${c.slug}`} className="group flex h-full flex-col rounded-3xl bg-ink p-7 text-bg shadow-card transition hover:shadow-float">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] opacity-60">Daily challenge</p>
        {streak ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 font-mono text-[11px]">
            <Flame size={12} className="text-accent" /> {streak} day{streak === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>
      <p className="mt-5 text-[13px] font-medium text-accent">{KIND_META[c.kind].label}</p>
      <h3 className="mt-1.5 font-serif text-[1.85rem] leading-[1.1]">{c.title}</h3>
      <p className="mt-3 line-clamp-4 text-[14.5px] leading-relaxed opacity-75">{c.prompt}</p>
      <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[14px] font-medium">
        {done ? "Done today — try another" : "Think it through"} <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function Grid({ ideas, states }: { ideas: Idea[]; states: ReturnType<typeof userStates> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {ideas.map((i, n) => (
        <IdeaCard key={i.id} idea={i} state={states[i.id]} index={n} />
      ))}
    </div>
  );
}

const See = ({ href, label = "See all" }: { href: string; label?: string }) => (
  <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-[13px] text-ink-3 hover:text-ink">
    {label} <ArrowRight size={13} />
  </Link>
);

export default async function Home() {
  const user = await getUser();
  refreshInBackground();
  const uid = user?.id ?? null;
  const featured = featuredIdea(uid);
  const trending = getFeed({ userId: uid, sort: "popular", limit: 3 }).items.map((x) => x.idea).filter((i) => i.id !== featured?.id);
  const world = getFeed({ userId: uid, source: "community", sort: "newest", limit: 3 }).items.map((x) => x.idea);

  if (!user) {
    const sample = getFeed({ userId: null, source: "editorial", sort: "for-you", limit: 6 }).items.map((x) => x.idea).filter((i) => i.id !== featured?.id).slice(0, 3);
    const states = userStates(null, [...sample, ...trending, ...world].map((i) => i.id));
    return (
      <div className="space-y-16">
        <section className="pt-4 animate-fade-up md:pt-10">
          <Eyebrow className="text-accent-text">An alternative to mindless scrolling</Eyebrow>
          <h1 className="mt-5 max-w-4xl font-serif text-[3.1rem] leading-[0.98] tracking-[-0.015em] text-ink md:text-[5.2rem]">
            Find an idea worth building. <span className="italic text-ink-3">Then build it.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-ink-2 md:text-lg">
            Idea Gym shows you real problems and projects from around the world, trains your creative thinking with daily exercises, and turns the idea you pick into a plan — for hackathons, side projects or a startup.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/discover" size="lg">
              Explore ideas <ArrowRight size={16} />
            </ButtonLink>
            <ButtonLink href="/hackathon" size="lg" variant="secondary">
              <Trophy size={16} /> I&apos;m at a hackathon
            </ButtonLink>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
            {[
              { icon: Compass, t: "Discover", d: "Curated problems, inventions and projects — with sources." },
              { icon: Dumbbell, t: "Think", d: "Five kinds of exercises that build creative muscle." },
              { icon: Shuffle, t: "Remix", d: "Combine ideas into ones nobody has tried." },
              { icon: Hammer, t: "Build", d: "Requirements, schema, milestones and tasks in one click." },
            ].map((s) => (
              <div key={s.t} className="bg-surface p-5">
                <s.icon size={18} className="text-accent" />
                <p className="mt-3 text-[15px] font-semibold text-ink">{s.t}</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">{s.d}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">{featured ? <Featured idea={featured} /> : null}</div>
          <ChallengeCard />
        </section>
        <section>
          <SectionHeader title="Start here" description="A few ideas from the editorial library." action={<See href="/discover" />} />
          <Grid ideas={sample} states={states} />
        </section>
        {world.length ? (
          <section>
            <SectionHeader title="From builders around the world" description="Recent Show HN posts and rising GitHub projects, with attribution." action={<See href="/discover?source=community" />} />
            <Grid ideas={world} states={states} />
          </section>
        ) : null}
      </div>
    );
  }

  // ---------- signed in ----------
  const gym = gymStats(user.id);
  const stats = profileStats(user.id);
  const signals = getSignals(user.id);
  const aff = computeAffinity(signals);
  const blindCats = CATEGORIES.map((c) => c.slug).filter((c) => (aff[c] ?? 0) <= 0);
  const day = Math.floor(Date.now() / 86_400_000);
  const blindCat = blindCats.length ? blindCats[day % blindCats.length] : null;
  const unexpected = blindCat ? getFeed({ userId: user.id, category: blindCat, sort: "popular", limit: 1 }).items[0]?.idea : undefined;
  const forYou = getFeed({ userId: user.id, sort: "for-you", limit: 6 }).items.map((x) => x.idea).filter((i) => i.id !== featured?.id && i.id !== unexpected?.id).slice(0, 3);
  const mine = ownedIdeas(user.id, "ai", 3);
  const saves = recentSaves(user.id, 3);
  const projects = listProjects(user.id).filter((p) => p.status !== "completed").slice(0, 3);
  const all = [featured, unexpected, ...forYou, ...trending, ...world, ...mine, ...saves].filter((x): x is Idea => !!x);
  const states = userStates(user.id, all.map((i) => i.id));
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-14">
      <section className="animate-fade-up">
        <h1 className="font-serif text-[2.6rem] leading-[1.04] text-ink md:text-[3.4rem]">
          {greeting()}, {firstName}.
        </h1>
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-ink-2">
          {gym.current ? (
            <span className="inline-flex items-center gap-1.5">
              <Flame size={15} className="text-accent" /> {gym.current}-day thinking streak
            </span>
          ) : (
            <span>Take today&apos;s challenge to start a thinking streak.</span>
          )}
          <span className="text-ink-3">·</span>
          <span>{stats.saved} saved</span>
          <span className="text-ink-3">·</span>
          <span>{stats.remixed} remixed</span>
          <span className="text-ink-3">·</span>
          <span>
            {stats.projectsStarted} project{stats.projectsStarted === 1 ? "" : "s"} started
          </span>
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">{featured ? <Featured idea={featured} saved={states[featured.id]?.saved} /> : null}</div>
        <ChallengeCard done={gym.todayDone} streak={gym.current} />
      </section>

      {unexpected ? (
        <section>
          <SectionHeader title="Discover something unexpected" description={`From ${categoryLabel(unexpected.category)} — a category you haven't explored yet.`} />
          <Link href={`/idea/${unexpected.id}`} className="group flex flex-col gap-4 rounded-2xl border border-dashed border-line-strong bg-bg-elev p-6 transition hover:border-accent md:flex-row md:items-center">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent-text">
              <Compass size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[18px] font-semibold text-ink group-hover:text-accent-text">{unexpected.title}</p>
              <p className="mt-1 line-clamp-2 text-[14px] text-ink-2">{unexpected.summary}</p>
            </div>
            <SourceTag idea={unexpected} />
          </Link>
        </section>
      ) : null}

      {projects.length || saves.length ? (
        <section>
          <SectionHeader title="Continue where you left off" />
          <div className="grid gap-4 md:grid-cols-3">
            {projects.map((p) => (
              <Link key={p.id} href={`/build/${p.id}`} className="group rounded-2xl border border-line bg-surface p-5 transition hover:border-line-strong hover:shadow-card">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-3">
                    <Hammer size={12} /> {p.status}
                  </span>
                  <span className="font-mono text-[12px] text-ink-2">{Math.round(p.progress * 100)}%</span>
                </div>
                <p className="mt-3 font-semibold text-ink">{p.title}</p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.max(3, p.progress * 100)}%` }} />
                </div>
                <p className="mt-2 text-[12.5px] text-ink-3">
                  {p.tasks.filter((t) => !t.done)[0]?.title ? `Next: ${p.tasks.filter((t) => !t.done)[0].title}` : "All tasks done — mark it complete"}
                </p>
              </Link>
            ))}
            {projects.length < 3
              ? saves.slice(0, 3 - projects.length).map((i) => (
                  <Link key={i.id} href={`/idea/${i.id}`} className="group rounded-2xl border border-line bg-surface p-5 transition hover:border-line-strong hover:shadow-card">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-3">
                      <Library size={12} /> Saved · {categoryLabel(i.category)}
                    </span>
                    <p className="mt-3 font-semibold text-ink group-hover:text-accent-text">{i.title}</p>
                    <p className="mt-1.5 line-clamp-2 text-[13.5px] text-ink-2">{i.summary}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-[12.5px] text-ink-3">
                      Turn it into a plan <ArrowRight size={12} />
                    </span>
                  </Link>
                ))
              : null}
          </div>
        </section>
      ) : null}

      <section>
        <SectionHeader title="Picked for you" description="Based on what you save, remix and build — not on how long you scroll." action={<See href="/discover" />} />
        <Grid ideas={forYou} states={states} />
      </section>

      {trending.length ? (
        <section>
          <SectionHeader title="Most saved this month" action={<See href="/discover?sort=popular" />} />
          <Grid ideas={trending.slice(0, 3)} states={states} />
        </section>
      ) : null}

      {world.length ? (
        <section>
          <SectionHeader title="New from builders around the world" description="Show HN and rising GitHub projects, explained with attribution." action={<See href="/discover?source=community" />} />
          <Grid ideas={world} states={states} />
        </section>
      ) : null}

      <section>
        <SectionHeader title="Your AI concepts" action={mine.length ? <See href="/discover?source=mine" /> : undefined} />
        {mine.length ? (
          <Grid ideas={mine} states={states} />
        ) : (
          <Card className="flex flex-col items-start gap-4 p-6 md:flex-row md:items-center">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink-2">
              <FlaskConical size={20} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-ink">Generate ideas shaped to your skills and time</p>
              <p className="mt-0.5 text-[14px] text-ink-2">Set your topic, constraints and style — get structured, buildable concepts with MVP scope and risks.</p>
            </div>
            <ButtonLink href="/lab" variant="secondary">
              Open AI Lab
            </ButtonLink>
          </Card>
        )}
      </section>
    </div>
  );
}
