"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, Heart, Link2, Shuffle, Sparkles } from "lucide-react";
import { api, errorMessage } from "@/lib/client";
import type { Idea } from "@/lib/types";
import { useIdeaActions, type IdeaState } from "@/components/idea-actions";
import { IdeaCard, IdeaCardSkeleton } from "@/components/idea-card";
import { useApp, type TrayIdea } from "@/components/providers";
import { Button, cx } from "@/components/ui";

export function DetailActions({ idea, state }: { idea: Idea; state: IdeaState }) {
  const a = useIdeaActions(idea, state);
  return (
    <div className="flex items-center gap-2">
      <Button variant={a.state.saved ? "secondary" : "primary"} onClick={a.toggleSave} aria-pressed={a.state.saved}>
        {a.state.saved ? <BookmarkCheck size={16} className="text-accent" /> : <Bookmark size={16} />}
        {a.state.saved ? "In your vault" : "Save idea"}
      </Button>
      <Button variant="secondary" onClick={a.toggleLike} aria-pressed={a.state.liked} aria-label={a.state.liked ? "Unlike" : "Like"}>
        <Heart size={16} fill={a.state.liked ? "currentColor" : "none"} className={a.state.liked ? "text-accent" : ""} />
        <span className="font-mono text-[13px]">{a.likes}</span>
      </Button>
      <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl" onClick={a.share} aria-label="Share">
        <Link2 size={16} />
      </Button>
    </div>
  );
}

export function AddToRemix({ idea }: { idea: TrayIdea }) {
  const { toggleTray, inTray } = useApp();
  const on = inTray(idea.id);
  return (
    <Button variant="secondary" size="lg" className={cx("justify-start", on && "border-accent text-accent-text")} onClick={() => toggleTray(idea)} aria-pressed={on}>
      <Shuffle size={16} /> {on ? "In remix tray" : "Add to remix tray"}
    </Button>
  );
}

export function SimilarIdeas({ ideaId }: { ideaId: string }) {
  const { requireAuth, aiEnabled } = useApp();
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!requireAuth("generate similar ideas")) return;
    setLoading(true);
    setError(null);
    try {
      const r = await api<{ ideas: Idea[] }>(`/api/ideas/${ideaId}/similar`, { body: {} });
      setIdeas(r.ideas);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-semibold text-ink">Similar, but different</h2>
          <p className="mt-0.5 text-[13px] text-ink-3">AI keeps what makes this interesting and changes the audience, mechanism or medium.</p>
        </div>
        {!ideas ? (
          <Button variant="secondary" onClick={run} loading={loading} disabled={!aiEnabled} title={aiEnabled ? undefined : "AI is not configured on this server"}>
            <Sparkles size={15} /> Generate 3 variations
          </Button>
        ) : null}
      </div>
      {!aiEnabled ? <p className="mt-3 text-[13px] text-ink-3">Unavailable: this server has no AI key configured.</p> : null}
      {error ? (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
          <Button size="sm" variant="ghost" onClick={run}>
            Try again
          </Button>
        </div>
      ) : null}
      {loading ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <IdeaCardSkeleton key={i} />
          ))}
        </div>
      ) : ideas ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {ideas.map((i, n) => (
            <IdeaCard key={i.id} idea={i} index={n} state={{ liked: false, saved: false, hidden: false, interesting: false }} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
