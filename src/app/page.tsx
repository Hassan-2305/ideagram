import Link from "next/link";
import { ArrowRight, Bookmark, Dumbbell, Flame, Hammer, Library, Shuffle, Trophy } from "lucide-react";
import { getUser } from "@/lib/auth";
import { featuredIdea, getFeed, getSignals } from "@/lib/repo/feed";
import { userStates } from "@/lib/repo/ideas";
import { gymStats, listProjects, profileStats } from "@/lib/repo/workspace";
import { computeAffinity } from "@/lib/recommend";
import { dailyChallenge, KIND_META } from "@/lib/challenges";
import { refreshInBackground } from "@/lib/ingest";
import { dayNumber } from "@/lib/time";
import { CATEGORIES, categoryLabel, type Idea } from "@/lib/types";
import { CategoryAvatar, CoverArt } from "@/components/cover-art";
import { HomeFeed } from "@/components/home-feed";
import { ButtonLink } from "@/components/ui";

function Story({ href, label, children, seen }: { href: string; label: string; children: React.ReactNode; seen?: boolean }) {
  return (
    <Link href={href} className="group flex w-[74px] shrink-0 flex-col items-center gap-1.5">
      <span className={seen ? "rounded-full bg-surface-3 p-[2.5px]" : "ring-brand rounded-full p-[2.5px]"}>
        <span className="grid place-items-center rounded-full bg-bg p-[3px] transition-transform group-hover:scale-105">{children}</span>
      </span>
      <span className="w-full truncate text-center text-[11.5px] text-ink-2">{label}</span>
    </Link>
  );
}

function StoriesRail({ categories, challengeDone, signedIn }: { categories: string[]; challengeDone?: boolean; signedIn: boolean }) {
  const c = dailyChallenge();
  return (
    <div className="glass no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 py-4 sm:mx-0 sm:rounded-[28px]">
      <Story href={`/gym/${c.slug}`} label="Today" seen={challengeDone}>
        <span className="bg-brand-warm grid h-[60px] w-[60px] place-items-center rounded-full text-white">
          <Dumbbell size={26} />
        </span>
      </Story>
      {signedIn ? (
        <Story href="/vault" label="Saved" seen>
          <span className="grid h-[60px] w-[60px] place-items-center rounded-full bg-surface-3 text-ink">
            <Bookmark size={24} />
          </span>
        </Story>
      ) : null}
      <Story href="/hackathon" label="Hackathon">
        <span className="bg-brand grid h-[60px] w-[60px] place-items-center rounded-full text-white">
          <Trophy size={24} />
        </span>
      </Story>
      {categories.map((slug) => (
        <Story key={slug} href={`/discover?category=${slug}`} label={categoryLabel(slug).replace(" & Machine Learning", "").replace(" Technology", "")}>
          <CategoryAvatar category={slug} size={60} />
        </Story>
      ))}
    </div>
  );
}

function MiniIdea({ idea, note }: { idea: Idea; note: string }) {
  return (
    <Link href={`/idea/${idea.id}`} className="group flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-surface-2">
      <CategoryAvatar category={idea.category} size={42} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold text-ink group-hover:text-accent-text">{idea.title}</span>
        <span className="block truncate text-[12px] text-ink-3">{note}</span>
      </span>
    </Link>
  );
}

export default async function Home() {
  const user = await getUser();
  refreshInBackground();
  const uid = user?.id ?? null;

  const feed = getFeed({ userId: uid, sort: "for-you", limit: 6 });
  const states = userStates(uid, feed.items.map((i) => i.idea.id));
  const featured = featuredIdea(uid);
  const trending = getFeed({ userId: uid, sort: "popular", limit: 4 }).items.map((x) => x.idea);

  const aff = computeAffinity(getSignals(uid));
  const preferred = CATEGORIES.map((c) => c.slug).sort((a, b) => (aff[b] ?? 0) - (aff[a] ?? 0));
  const blind = CATEGORIES.map((c) => c.slug).filter((c) => (aff[c] ?? 0) <= 0);
  const blindCat = blind.length ? blind[dayNumber() % blind.length] : null;
  const unexpected = blindCat ? getFeed({ userId: uid, category: blindCat, source: "editorial", sort: "popular", limit: 1 }).items[0]?.idea : undefined;

  const gym = user ? gymStats(user.id) : null;
  const stats = user ? profileStats(user.id) : null;
  const project = user ? listProjects(user.id).find((p) => p.status !== "completed") : undefined;
  const challenge = dailyChallenge();

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,500px)_300px] lg:justify-center xl:gap-14">
      <div className="mx-auto w-full min-w-0 max-w-[500px] space-y-6 lg:mx-0">
        <StoriesRail categories={preferred} challengeDone={gym?.todayDone} signedIn={!!user} />

        {!user ? (
          <section className="glass relative overflow-hidden rounded-[28px] p-6 animate-fade-up">
            <div className="bg-brand pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-40 blur-3xl" />
            <p className="text-brand text-[13px] font-bold">Scroll less. Build more.</p>
            <h1 className="mt-2 text-[1.9rem] font-extrabold leading-[1.1] tracking-[-0.03em] text-ink">A feed that makes you sharper, not sleepier.</h1>
            <p className="mt-3 text-[14.5px] leading-relaxed text-ink-2">
              Real problems and projects from around the world, daily thinking workouts, and AI that turns the idea you love into a plan.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <ButtonLink href="/signup">Join free</ButtonLink>
              <ButtonLink href="/hackathon" variant="secondary">
                <Trophy size={16} /> At a hackathon?
              </ButtonLink>
            </div>
          </section>
        ) : null}

        {featured ? (
          <Link href={`/idea/${featured.id}`} className="group relative block overflow-hidden rounded-[28px] shadow-card animate-fade-up">
            <CoverArt id={featured.id} title={featured.title} category={featured.category} summary={featured.summary} variant="hero" className="aspect-[16/11] w-full transition-transform duration-700 group-hover:scale-[1.02]" />
            <span className="absolute right-4 top-4 rounded-full border border-white/30 bg-black/20 px-3 py-1 text-[11.5px] font-bold text-white backdrop-blur-md">✦ Idea of the day</span>
          </Link>
        ) : null}

        <HomeFeed initial={{ items: feed.items, nextCursor: feed.nextCursor, states }} />
      </div>

      {/* desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-10 space-y-5">
          {user && stats ? (
            <Link href="/profile" className="flex items-center gap-3 px-1">
              <span className="ring-brand rounded-full p-[2px]">
                <span className="bg-brand-warm grid h-12 w-12 place-items-center rounded-full border-2 border-[var(--bg)] text-[17px] font-bold text-white">{user.name.slice(0, 1).toUpperCase()}</span>
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[14.5px] font-bold text-ink">{user.name}</span>
                <span className="block text-[12.5px] text-ink-3">
                  {stats.saved} saved · {stats.remixed} remixes · {stats.projectsStarted} projects
                </span>
              </span>
            </Link>
          ) : null}

          <Link href={`/gym/${challenge.slug}`} className="glass group block overflow-hidden rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-bold text-ink-3">Daily challenge</span>
              {gym?.current ? (
                <span className="flex items-center gap-1 rounded-full bg-warn-soft px-2 py-0.5 text-[12px] font-bold text-warn">
                  <Flame size={13} /> {gym.current}
                </span>
              ) : null}
            </div>
            <p className="text-brand mt-3 text-[12.5px] font-bold">{KIND_META[challenge.kind].label}</p>
            <p className="mt-1 text-[16px] font-bold leading-snug text-ink">{challenge.title}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-accent-text">
              {gym?.todayDone ? "Done today — try another" : "Start thinking"} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          {project ? (
            <Link href={`/build/${project.id}`} className="glass block rounded-3xl p-5">
              <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-ink-3">
                <Hammer size={13} /> Keep building
              </span>
              <p className="mt-2 truncate text-[15px] font-bold text-ink">{project.title}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
                <div className="bg-brand h-full rounded-full" style={{ width: `${Math.max(4, project.progress * 100)}%` }} />
              </div>
            </Link>
          ) : null}

          <div className="glass rounded-3xl p-3">
            <p className="px-2 pb-1 pt-1 text-[13px] font-bold text-ink-3">Suggested for you</p>
            {unexpected ? <MiniIdea idea={unexpected} note={`New to you · ${categoryLabel(unexpected.category)}`} /> : null}
            {trending
              .filter((t) => t.id !== unexpected?.id)
              .slice(0, 3)
              .map((t) => (
                <MiniIdea key={t.id} idea={t} note={`Popular · ${t.saveCount} saves`} />
              ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link href="/remix" className="glass flex items-center gap-2 rounded-2xl px-3 py-3 text-[13px] font-semibold text-ink hover:bg-surface-3">
              <Shuffle size={16} className="text-accent" /> Remix
            </Link>
            <Link href="/vault" className="glass flex items-center gap-2 rounded-2xl px-3 py-3 text-[13px] font-semibold text-ink hover:bg-surface-3">
              <Library size={16} className="text-accent" /> Saved
            </Link>
          </div>
          <p className="px-1 text-[11.5px] leading-relaxed text-ink-3">Ranked by what you save, remix and build — never by time spent.</p>
        </div>
      </aside>
    </div>
  );
}
