"use client";

import { useState } from "react";
import { api, errorMessage } from "@/lib/client";
import type { Idea } from "@/lib/types";
import type { IdeaState } from "./idea-actions";
import { IdeaPost } from "./idea-post";
import { Button } from "./ui";

interface Page {
  items: { idea: Idea; reason?: string }[];
  nextCursor: number | null;
  states: Record<string, IdeaState>;
}

const EMPTY: IdeaState = { liked: false, saved: false, hidden: false, interesting: false };

/** Single-column post feed with deliberate "show more" paging (no infinite scroll). */
export function HomeFeed({ initial }: { initial: Page }) {
  const [page, setPage] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const more = async () => {
    if (page.nextCursor == null) return;
    setBusy(true);
    setError(null);
    try {
      const next = await api<Page>(`/api/feed?limit=6&cursor=${page.nextCursor}`);
      setPage((p) => ({
        items: [...p.items, ...next.items.filter((x) => !p.items.some((y) => y.idea.id === x.idea.id))],
        nextCursor: next.nextCursor,
        states: { ...p.states, ...next.states },
      }));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {page.items.map((it, i) => (
        <IdeaPost key={it.idea.id} idea={it.idea} state={page.states[it.idea.id] ?? EMPTY} reason={it.reason} index={i} />
      ))}
      {error ? <p className="text-center text-sm text-danger">{error}</p> : null}
      {page.nextCursor != null ? (
        <div className="flex flex-col items-center gap-2 pt-2">
          <Button variant="secondary" onClick={more} loading={busy}>
            Show more ideas
          </Button>
          <p className="text-[12.5px] text-ink-3">Saved something good? This is a nice moment to stop and build.</p>
        </div>
      ) : (
        <div className="glass rounded-3xl p-6 text-center">
          <p className="text-[15px] font-bold text-ink">You&apos;re all caught up ✨</p>
          <p className="mt-1 text-[13.5px] text-ink-2">Remix something you saved, or take today&apos;s challenge.</p>
        </div>
      )}
    </div>
  );
}
