"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck, EyeOff, Flag, Heart, Link2, MoreHorizontal, Shuffle, Sparkles, Star, X, Hammer } from "lucide-react";
import { api, errorMessage } from "@/lib/client";
import type { Idea } from "@/lib/types";
import { useApp } from "./providers";
import { Button, buttonClass, cx, Textarea } from "./ui";

export interface IdeaState {
  liked: boolean;
  saved: boolean;
  hidden: boolean;
  interesting: boolean;
}

type Action = "like" | "unlike" | "save" | "unsave" | "hide" | "unhide" | "interesting" | "report";

export function useIdeaActions(idea: Pick<Idea, "id" | "title" | "category" | "likeCount">, initial: IdeaState) {
  const { toast, requireAuth } = useApp();
  const [state, setState] = useState(initial);
  const [likes, setLikes] = useState(idea.likeCount);

  const send = async (action: Action, extra?: Record<string, unknown>) =>
    api<{ likeCount?: number }>(`/api/ideas/${idea.id}/action`, { body: { action, ...extra } });

  const toggleSave = async () => {
    if (!requireAuth("save ideas to your vault")) return;
    const next = !state.saved;
    setState((s) => ({ ...s, saved: next }));
    try {
      await send(next ? "save" : "unsave");
      toast(next ? "Saved to your vault" : "Removed from vault", "success", next ? { label: "Open vault", href: "/vault" } : undefined);
    } catch (e) {
      setState((s) => ({ ...s, saved: !next }));
      toast(errorMessage(e), "error");
    }
  };

  const toggleLike = async () => {
    if (!requireAuth("like ideas and shape your feed")) return;
    const next = !state.liked;
    setState((s) => ({ ...s, liked: next }));
    setLikes((n) => n + (next ? 1 : -1));
    try {
      const r = await send(next ? "like" : "unlike");
      if (typeof r.likeCount === "number") setLikes(r.likeCount);
    } catch (e) {
      setState((s) => ({ ...s, liked: !next }));
      setLikes((n) => n + (next ? -1 : 1));
      toast(errorMessage(e), "error");
    }
  };

  const markInteresting = async () => {
    if (!requireAuth("tune your recommendations")) return;
    setState((s) => ({ ...s, interesting: true }));
    try {
      await send("interesting");
      toast("Noted — you'll see more like this", "info");
    } catch (e) {
      setState((s) => ({ ...s, interesting: false }));
      toast(errorMessage(e), "error");
    }
  };

  const hide = async (onHidden?: () => void) => {
    if (!requireAuth("hide ideas from your feed")) return;
    setState((s) => ({ ...s, hidden: true }));
    onHidden?.();
    try {
      await send("hide");
      toast("Hidden. We'll show fewer like it.", "info", {
        label: "Undo",
        onClick: async () => {
          await send("unhide").catch(() => {});
          setState((s) => ({ ...s, hidden: false }));
        },
      });
    } catch (e) {
      setState((s) => ({ ...s, hidden: false }));
      toast(errorMessage(e), "error");
    }
  };

  const report = async (reason: string, note: string) => {
    await send("report", { reason, note });
    toast("Thanks — the report was recorded for review.", "success");
  };

  const share = async () => {
    const url = `${location.origin}/idea/${idea.id}`;
    try {
      if (navigator.share) await navigator.share({ title: idea.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Link copied", "success");
      }
    } catch {
      /* user cancelled share */
    }
  };

  return { state, likes, toggleSave, toggleLike, markInteresting, hide, report, share };
}

const REPORT_REASONS = [
  { value: "inaccurate", label: "Inaccurate or misleading" },
  { value: "broken-source", label: "Source link is broken or wrong" },
  { value: "duplicate", label: "Duplicate" },
  { value: "low-quality", label: "Low quality / not useful" },
  { value: "inappropriate", label: "Inappropriate" },
];

export function ReportDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: (reason: string, note: string) => Promise<void> }) {
  const [reason, setReason] = useState("inaccurate");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-black/40 p-4 animate-fade-in sm:place-items-center" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-float animate-pop"
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await onSubmit(reason, note.trim());
            onClose();
          } catch (err) {
            setError(errorMessage(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="flex items-center justify-between">
          <h2 id="report-title" className="text-lg font-semibold text-ink">
            Report this idea
          </h2>
          <button type="button" onClick={onClose} className={buttonClass("ghost", "icon")} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <fieldset className="mt-4 space-y-1.5">
          <legend className="sr-only">Reason</legend>
          {REPORT_REASONS.map((r) => (
            <label key={r.value} className={cx("flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm", reason === r.value ? "border-ink text-ink" : "border-line text-ink-2")}>
              <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="accent-[var(--accent)]" />
              {r.label}
            </label>
          ))}
        </fieldset>
        <Textarea className="mt-3 min-h-20" placeholder="Optional details" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} aria-label="Details" />
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            Submit report
          </Button>
        </div>
      </form>
    </div>
  );
}

/** Compact action row used on cards. */
export function IdeaActionBar({
  idea,
  initial,
  onHidden,
  size = "sm",
}: {
  idea: Pick<Idea, "id" | "title" | "category" | "likeCount">;
  initial: IdeaState;
  onHidden?: () => void;
  size?: "sm" | "md";
}) {
  const a = useIdeaActions(idea, initial);
  const { toggleTray, inTray } = useApp();
  const [menu, setMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  const icon = size === "md" ? 18 : 16;
  const inRemix = inTray(idea.id);

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={a.toggleSave}
        aria-pressed={a.state.saved}
        aria-label={a.state.saved ? "Remove from vault" : "Save to vault"}
        className={cx(buttonClass("ghost", "icon"), a.state.saved && "text-accent hover:text-accent")}
      >
        {a.state.saved ? <BookmarkCheck size={icon} /> : <Bookmark size={icon} />}
      </button>
      <button onClick={a.toggleLike} aria-pressed={a.state.liked} aria-label={a.state.liked ? "Unlike" : "Like"} className={cx(buttonClass("ghost", "sm", "px-2"), a.state.liked && "text-accent hover:text-accent")}>
        <Heart size={icon} fill={a.state.liked ? "currentColor" : "none"} />
        {a.likes > 0 ? <span className="font-mono text-[12px]">{a.likes}</span> : null}
      </button>
      <button
        onClick={() => toggleTray({ id: idea.id, title: idea.title, category: idea.category })}
        aria-pressed={inRemix}
        aria-label={inRemix ? "Remove from remix tray" : "Add to remix tray"}
        title="Add to remix tray"
        className={cx(buttonClass("ghost", "icon"), inRemix && "bg-accent-soft text-accent-text")}
      >
        <Shuffle size={icon} />
      </button>
      <div className="relative">
        <button onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} aria-label="More actions" className={buttonClass("ghost", "icon")}>
          <MoreHorizontal size={icon} />
        </button>
        {menu ? (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
            <div role="menu" className="absolute right-0 bottom-full z-50 mb-1 w-56 rounded-xl border border-line bg-surface p-1.5 shadow-float animate-pop">
              <MenuItem icon={<Sparkles size={15} />} label="Generate similar ideas" href={`/idea/${idea.id}#similar`} onDone={() => setMenu(false)} />
              <MenuItem icon={<Hammer size={15} />} label="Build this idea" href={`/build/new?idea=${idea.id}`} onDone={() => setMenu(false)} />
              <MenuItem icon={<Star size={15} />} label={a.state.interesting ? "Marked interesting" : "Mark as interesting"} onClick={a.markInteresting} disabled={a.state.interesting} onDone={() => setMenu(false)} />
              <MenuItem icon={<Link2 size={15} />} label="Share" onClick={a.share} onDone={() => setMenu(false)} />
              <div className="my-1 h-px bg-line" />
              <MenuItem icon={<EyeOff size={15} />} label="Not for me — hide" onClick={() => a.hide(onHidden)} onDone={() => setMenu(false)} />
              <MenuItem icon={<Flag size={15} />} label="Report inaccurate content" onClick={() => setReporting(true)} onDone={() => setMenu(false)} />
            </div>
          </>
        ) : null}
      </div>
      {reporting ? <ReportDialog onClose={() => setReporting(false)} onSubmit={a.report} /> : null}
    </div>
  );
}

function MenuItem({ icon, label, onClick, href, disabled, onDone }: { icon: React.ReactNode; label: string; onClick?: () => void; href?: string; disabled?: boolean; onDone: () => void }) {
  const cls = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-ink-2 hover:bg-surface-2 hover:text-ink disabled:opacity-50";
  if (href)
    return (
      <Link role="menuitem" href={href} className={cls} onClick={onDone}>
        {icon} {label}
      </Link>
    );
  return (
    <button
      role="menuitem"
      className={cls}
      disabled={disabled}
      onClick={() => {
        onDone();
        onClick?.();
      }}
    >
      {icon} {label}
    </button>
  );
}
