"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CornerDownLeft, Library, Search, Sparkles } from "lucide-react";
import { api } from "@/lib/client";
import { categoryLabel, CATEGORIES } from "@/lib/types";
import { cx, Kbd, Spinner } from "./ui";

interface Hit {
  id: string;
  title: string;
  summary: string;
  category: string;
  saved: boolean;
}

type Row = { kind: "idea"; hit: Hit } | { kind: "nav"; label: string; href: string; hint: string };

const QUICK: Row[] = [
  { kind: "nav", label: "Generate ideas in AI Lab", href: "/lab", hint: "AI Lab" },
  { kind: "nav", label: "Start Hackathon Mode", href: "/hackathon", hint: "Hackathon" },
  { kind: "nav", label: "Today's thinking challenge", href: "/gym", hint: "Gym" },
  { kind: "nav", label: "Open your Idea Vault", href: "/vault", hint: "Vault" },
];

export function CommandSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
  }, [open]);

  const close = () => {
    setQ("");
    setHits([]);
    setError(null);
    setLoading(false);
    onClose();
  };

  useEffect(() => {
    if (!q.trim()) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await api<{ results: Hit[] }>(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        setHits(r.results);
        setError(null);
        setActive(0);
      } catch (e) {
        if (!(e instanceof DOMException)) setError(e instanceof Error ? e.message : "Search failed");
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const categoryMatches = useMemo(
    () => (q.trim().length > 1 ? CATEGORIES.filter((c) => c.label.toLowerCase().includes(q.toLowerCase())).slice(0, 3) : []),
    [q],
  );

  const rows: Row[] = q.trim()
    ? [
        ...(q.trim() ? hits : []).map((hit) => ({ kind: "idea" as const, hit })),
        ...categoryMatches.map((c) => ({ kind: "nav" as const, label: `Browse ${c.label}`, href: `/discover?category=${c.slug}`, hint: "Category" })),
        { kind: "nav", label: `See all results for “${q.trim()}”`, href: `/discover?q=${encodeURIComponent(q.trim())}`, hint: "Discover" },
        { kind: "nav", label: `Generate ideas about “${q.trim()}”`, href: `/lab?topic=${encodeURIComponent(q.trim())}`, hint: "AI Lab" },
      ]
    : QUICK;

  const go = (r: Row) => {
    close();
    router.push(r.kind === "idea" ? `/idea/${r.hit.id}` : r.href);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[75] bg-black/40 p-3 pt-[10vh] animate-fade-in sm:p-6 sm:pt-[12vh]" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-float animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          {loading ? <Spinner className="text-ink-3" /> : <Search size={17} className="text-ink-3" />}
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") close();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, rows.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              }
              if (e.key === "Enter" && rows[active]) go(rows[active]);
            }}
            placeholder="Search ideas, problems, technologies…"
            aria-label="Search query"
            role="combobox"
            aria-expanded="true"
            aria-controls="search-results"
            aria-activedescendant={rows[active] ? `sr-${active}` : undefined}
            className="h-14 flex-1 bg-transparent text-[15px] text-ink placeholder:text-ink-3 focus:outline-none"
          />
          <Kbd>Esc</Kbd>
        </div>
        <ul id="search-results" role="listbox" className="max-h-[55vh] overflow-y-auto p-2">
          {!q.trim() ? <li className="px-3 pb-1 pt-2 font-mono text-[11px] uppercase tracking-wider text-ink-3">Jump to</li> : null}
          {error ? <li className="px-3 py-3 text-sm text-danger">{error}</li> : null}
          {q.trim() && !loading && hits.length === 0 && !error ? (
            <li className="px-3 py-3 text-sm text-ink-3">No saved or published ideas match yet — try a broader word, or generate some.</li>
          ) : null}
          {rows.map((r, i) => (
            <li
              key={i}
              id={`sr-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(r)}
              className={cx("flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5", i === active ? "bg-surface-2" : "")}
            >
              {r.kind === "idea" ? (
                <>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-3 text-ink-2">
                    {r.hit.saved ? <Library size={15} /> : <Sparkles size={15} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{r.hit.title}</span>
                    <span className="block truncate text-xs text-ink-3">
                      {categoryLabel(r.hit.category)}
                      {r.hit.saved ? " · in your vault" : ""} — {r.hit.summary}
                    </span>
                  </span>
                </>
              ) : (
                <>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-ink-3">
                    <ArrowRight size={15} />
                  </span>
                  <span className="flex-1 text-sm text-ink">{r.label}</span>
                  <span className="font-mono text-[11px] text-ink-3">{r.hint}</span>
                </>
              )}
              {i === active ? <CornerDownLeft size={14} className="text-ink-3" /> : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
