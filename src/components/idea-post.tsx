"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Bookmark, EyeOff, Flag, Hammer, Heart, MessageCircle, MoreHorizontal, Send, Shuffle, Sparkles, Star } from "lucide-react";
import { categoryLabel, type Idea } from "@/lib/types";
import { categoryStyle } from "@/lib/category-style";
import { CategoryAvatar, CoverArt } from "./cover-art";
import { ReportDialog, useIdeaActions, type IdeaState } from "./idea-actions";
import { useApp } from "./providers";
import { cx } from "./ui";

function ago(iso: string | null) {
  if (!iso) return "";
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 3600) return `${Math.max(1, Math.round(d / 60))}m`;
  if (d < 86_400) return `${Math.round(d / 3600)}h`;
  if (d < 86_400 * 7) return `${Math.round(d / 86_400)}d`;
  return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" });
}

function author(idea: Idea) {
  if (idea.sourceKind === "editorial") return "ideagym";
  if (idea.sourceKind === "ai") return "ai.lab";
  if (idea.sourceKind === "remix") return "remix.engine";
  if (idea.sourceKind === "user") return idea.creator ?? "you";
  return idea.creator ?? idea.sourceName.toLowerCase();
}

const REASON: Record<string, string> = { explore: "Blind spot · new to you", fresh: "Just in" };

export function IdeaPost({ idea, state, reason, index = 0, onHidden }: { idea: Idea; state: IdeaState; reason?: string; index?: number; onHidden?: () => void }) {
  const a = useIdeaActions(idea, state);
  const { toggleTray, inTray } = useApp();
  const [menu, setMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [burst, setBurst] = useState(0);
  const [gone, setGone] = useState(false);
  const lastTap = useRef(0);
  const inRemix = inTray(idea.id);
  const sub = idea.sourceKind === "hackernews" || idea.sourceKind === "github" ? `via ${idea.sourceName}` : categoryLabel(idea.category);

  if (gone) return null;

  const onCoverTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 320) {
      setBurst((b) => b + 1);
      if (!a.state.liked) a.toggleLike();
    }
    lastTap.current = now;
  };

  return (
    <article className="glass overflow-hidden rounded-[28px] animate-fade-up" style={{ animationDelay: `${Math.min(index, 5) * 50}ms` }}>
      {/* header */}
      <header className="flex items-center gap-3 px-4 py-3">
        <CategoryAvatar category={idea.category} size={34} ring={reason === "explore"} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[14px] font-bold text-ink">
            {author(idea)}
            {idea.sourceKind === "editorial" ? <span className="bg-brand ml-1.5 inline-grid h-3.5 w-3.5 translate-y-[1px] place-items-center rounded-full align-baseline text-[8px] text-white">✓</span> : null}
            <span className="font-normal text-ink-3"> · {ago(idea.publishedAt ?? idea.createdAt)}</span>
          </p>
          <p className="truncate text-[12.5px] text-ink-3">{reason && REASON[reason] ? REASON[reason] : sub}</p>
        </div>
        <div className="relative">
          <button onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} aria-label="More actions" className="grid h-9 w-9 place-items-center rounded-full text-ink-2 hover:bg-surface-2 hover:text-ink">
            <MoreHorizontal size={20} />
          </button>
          {menu ? (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
              <div role="menu" className="glass-strong absolute right-0 top-full z-50 mt-1 w-60 overflow-hidden rounded-2xl p-1.5 shadow-float animate-pop">
                {[
                  { icon: Sparkles, label: "Generate similar ideas", href: `/idea/${idea.id}#similar` },
                  { icon: Hammer, label: "Build this idea", href: `/build/new?idea=${idea.id}` },
                ].map((x) => (
                  <Link key={x.label} role="menuitem" href={x.href} onClick={() => setMenu(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-ink hover:bg-surface-2">
                    <x.icon size={17} /> {x.label}
                  </Link>
                ))}
                <button role="menuitem" disabled={a.state.interesting} onClick={() => (setMenu(false), a.markInteresting())} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] text-ink hover:bg-surface-2 disabled:opacity-50">
                  <Star size={17} /> {a.state.interesting ? "Marked interesting" : "More like this"}
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenu(false);
                    a.hide(() => {
                      setGone(true);
                      onHidden?.();
                    });
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] text-ink hover:bg-surface-2"
                >
                  <EyeOff size={17} /> Not interested
                </button>
                <button role="menuitem" onClick={() => (setMenu(false), setReporting(true))} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] text-danger hover:bg-danger-soft">
                  <Flag size={17} /> Report
                </button>
              </div>
            </>
          ) : null}
        </div>
      </header>

      {/* cover — double-tap to like */}
      <div className="relative select-none" onClick={onCoverTap}>
        <CoverArt id={idea.id} title={idea.title} category={idea.category} className="aspect-[4/5] w-full sm:aspect-square" />
        {burst ? (
          <Heart key={burst} aria-hidden fill="white" className="pointer-events-none absolute left-1/2 top-1/2 -ml-14 -mt-14 h-28 w-28 text-white drop-shadow-[0_6px_30px_rgba(236,72,153,0.8)] animate-heart" />
        ) : null}
      </div>

      {/* actions */}
      <div className="flex items-center gap-1 px-2.5 pt-2">
        <button onClick={a.toggleLike} aria-pressed={a.state.liked} aria-label={a.state.liked ? "Unlike" : "Like"} className="grid h-10 w-10 place-items-center rounded-full transition active:scale-90">
          <Heart size={25} strokeWidth={1.9} fill={a.state.liked ? "#f43f5e" : "none"} className={a.state.liked ? "text-[#f43f5e] animate-pop" : "text-ink hover:text-ink-2"} />
        </button>
        <Link href={`/idea/${idea.id}`} aria-label="Open idea" className="grid h-10 w-10 place-items-center rounded-full text-ink hover:text-ink-2">
          <MessageCircle size={24} strokeWidth={1.9} className="-scale-x-100" />
        </Link>
        <button onClick={a.share} aria-label="Share" className="grid h-10 w-10 place-items-center rounded-full text-ink hover:text-ink-2">
          <Send size={22} strokeWidth={1.9} />
        </button>
        <button
          onClick={() => toggleTray({ id: idea.id, title: idea.title, category: idea.category })}
          aria-pressed={inRemix}
          aria-label={inRemix ? "Remove from remix tray" : "Add to remix tray"}
          className={cx("grid h-10 w-10 place-items-center rounded-full transition", inRemix ? "bg-accent-soft text-accent" : "text-ink hover:text-ink-2")}
        >
          <Shuffle size={22} strokeWidth={1.9} />
        </button>
        <button onClick={a.toggleSave} aria-pressed={a.state.saved} aria-label={a.state.saved ? "Remove from saved" : "Save"} className="ml-auto grid h-10 w-10 place-items-center rounded-full transition active:scale-90">
          <Bookmark size={24} strokeWidth={1.9} fill={a.state.saved ? "currentColor" : "none"} className={a.state.saved ? "text-accent animate-pop" : "text-ink hover:text-ink-2"} />
        </button>
      </div>

      {/* caption */}
      <div className="px-4 pb-4">
        <p className="text-[14px] font-bold text-ink">
          {a.likes.toLocaleString()} {a.likes === 1 ? "like" : "likes"}
          {idea.saveCount ? <span className="font-normal text-ink-3"> · {idea.saveCount} saved</span> : null}
        </p>
        <p className={cx("mt-1 text-[14px] leading-relaxed text-ink", !expanded && "line-clamp-2")}>
          <span className="font-bold">{author(idea)}</span> {idea.summary}
          {expanded && idea.insight ? <span className="mt-2 block text-ink-2">💡 {idea.insight}</span> : null}
        </p>
        {!expanded && (idea.summary.length > 110 || idea.insight) ? (
          <button onClick={() => setExpanded(true)} className="text-[14px] text-ink-3 hover:text-ink-2">
            more
          </button>
        ) : null}
        {idea.stack.length ? (
          <p className="mt-1.5 line-clamp-1 text-[13.5px] font-medium" style={{ color: categoryStyle(idea.category).from }}>
            {idea.stack
              .slice(0, 4)
              .map((s) => `#${s.toLowerCase().replace(/[^a-z0-9]+/g, "")}`)
              .join(" ")}
          </p>
        ) : null}
        <Link href={`/idea/${idea.id}`} className="mt-1.5 block text-[13.5px] text-ink-3 hover:text-ink-2">
          View the full breakdown{idea.difficulty ? ` · ${idea.difficulty}` : ""}
          {idea.buildTime ? ` · ${idea.buildTime}` : ""}
        </Link>
      </div>
      {reporting ? <ReportDialog onClose={() => setReporting(false)} onSubmit={a.report} /> : null}
    </article>
  );
}

/** Square tile for the Explore grid and profile grid. */
export function IdeaTile({ idea, index = 0 }: { idea: Idea; index?: number }) {
  return (
    <Link href={`/idea/${idea.id}`} className="group relative block overflow-hidden rounded-2xl animate-fade-in" style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}>
      <CoverArt id={idea.id} title={idea.title} category={idea.category} variant="tile" className="aspect-square w-full transition-transform duration-500 group-hover:scale-[1.04]" />
      <span className="absolute inset-0 flex items-center justify-center gap-5 bg-black/45 text-[14px] font-bold text-white opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
        <span className="flex items-center gap-1.5">
          <Heart size={18} fill="white" /> {idea.likeCount}
        </span>
        <span className="flex items-center gap-1.5">
          <Bookmark size={18} fill="white" /> {idea.saveCount}
        </span>
      </span>
    </Link>
  );
}

export function IdeaPostSkeleton() {
  return (
    <div className="glass overflow-hidden rounded-[28px]">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="skeleton h-9 w-9 rounded-full" />
        <div className="flex-1">
          <div className="skeleton h-3 w-28" />
          <div className="skeleton mt-1.5 h-2.5 w-20" />
        </div>
      </div>
      <div className="skeleton aspect-square w-full rounded-none" />
      <div className="space-y-2 p-4">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-2/3" />
      </div>
    </div>
  );
}
