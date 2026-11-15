import type { Metadata } from "next";
import { Suspense } from "react";
import { getUser } from "@/lib/auth";
import { getFeed, type FeedSort } from "@/lib/repo/feed";
import { userStates } from "@/lib/repo/ideas";
import { refreshInBackground, sourceStatus } from "@/lib/ingest";
import { CATEGORY_SLUGS, DIFFICULTIES, categoryLabel } from "@/lib/types";
import { DiscoverFeed } from "@/components/feed";
import { PageHeader } from "@/components/ui";
import { IngestButton } from "./ingest-button";

export const metadata: Metadata = { title: "Discover" };

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await getUser();
  refreshInBackground();
  const category = sp.category && (CATEGORY_SLUGS as string[]).includes(sp.category) ? sp.category : null;
  const sort = (["for-you", "newest", "popular", "quick"].includes(sp.sort ?? "") ? sp.sort : "for-you") as FeedSort;
  const source = ["editorial", "hackernews", "github", "community", ...(user ? ["mine"] : [])].includes(sp.source ?? "") ? sp.source! : null;
  const difficulty = sp.difficulty && (DIFFICULTIES as readonly string[]).includes(sp.difficulty) ? sp.difficulty : null;
  const page = getFeed({ userId: user?.id ?? null, category, sort, source, difficulty, q: sp.q?.slice(0, 120) ?? null, limit: 12 });
  const states = userStates(user?.id ?? null, page.items.map((i) => i.idea.id));
  const sources = sourceStatus();
  const external = sources.reduce((n, s) => n + s.count, 0);

  return (
    <>
      <PageHeader
        eyebrow={category ? categoryLabel(category) : "Discover"}
        title={<>Ideas worth your attention</>}
        description={
          <>
            Editorial ideas from the Idea Gym team, plus {external > 0 ? `${external} ` : ""}real projects from Hacker News and GitHub with full attribution. Save what sparks you; hide what doesn&apos;t — the feed learns either way.
          </>
        }
        actions={user ? <IngestButton /> : null}
      />
      <Suspense>
        <DiscoverFeed initial={{ ...page, states }} />
      </Suspense>
    </>
  );
}
