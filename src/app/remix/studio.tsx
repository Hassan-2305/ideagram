"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Hammer, History, Plus, Shuffle, Sparkles, X } from "lucide-react";
import { api, errorMessage } from "@/lib/client";
import { categoryLabel, type Idea } from "@/lib/types";
import { IdeaActionBar } from "@/components/idea-actions";
import { Meta } from "@/components/idea-card";
import { useApp } from "@/components/providers";
import { Badge, Button, buttonClass, cx, EmptyState, Input, Textarea } from "@/components/ui";

type Pick = { kind: "idea"; id: string; title: string; category: string } | { kind: "concept"; label: string };
interface HistoryItem {
  id: string;
  createdAt: string;
  instruction: string;
  inputs: { id: string; title: string }[];
  result: { id: string; title: string; summary: string; category: string };
}

const SPARKS: [string, string][] = [
  ["Google Maps", "GitHub"],
  ["Spotify", "Language learning"],
  ["AI agents", "Personal finance"],
  ["Computer vision", "Accessibility"],
  ["Local LLMs", "Desktop automation"],
  ["Beekeeping", "Version control"],
  ["Strava", "Volunteering"],
  ["E-ink displays", "Public transit"],
];

export function RemixStudio({
  initial,
  library,
  history,
}: {
  initial: { id: string; title: string; category: string }[];
  library: { id: string; title: string; category: string; sourceKind: string }[];
  history: HistoryItem[];
}) {
  const { toast, aiEnabled, clearTray } = useApp();
  const [picks, setPicks] = useState<Pick[]>(initial.map((i) => ({ kind: "idea", ...i })));
  const [concept, setConcept] = useState("");
  const [filter, setFilter] = useState("");
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ idea: Idea; feasibility: string } | null>(null);
  const [past, setPast] = useState(history);

  useEffect(() => {
    if (initial.length) clearTray();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const full = picks.length >= 4;
  const add = (p: Pick) => {
    if (full) return toast("Remix up to four inputs at a time.", "info");
    if (p.kind === "idea" && picks.some((x) => x.kind === "idea" && x.id === p.id)) return;
    setPicks((cur) => [...cur, p]);
  };
  const remove = (i: number) => setPicks((cur) => cur.filter((_, n) => n !== i));

  const filtered = useMemo(
    () => library.filter((l) => !picks.some((p) => p.kind === "idea" && p.id === l.id) && l.title.toLowerCase().includes(filter.toLowerCase())).slice(0, 8),
    [library, picks, filter],
  );

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const r = await api<{ idea: Idea; feasibility: string }>("/api/remix", {
        body: {
          ideaIds: picks.filter((p) => p.kind === "idea").map((p) => (p as { id: string }).id),
          concepts: picks.filter((p) => p.kind === "concept").map((p) => (p as { label: string }).label),
          instruction: instruction.trim(),
        },
      });
      setResult(r);
      setPast((h) => [
        {
          id: r.idea.id,
          createdAt: new Date().toISOString(),
          instruction: instruction.trim(),
          inputs: picks.map((p) => (p.kind === "idea" ? { id: p.id, title: p.title } : { id: "", title: p.label })),
          result: { id: r.idea.id, title: r.idea.title, summary: r.idea.summary, category: r.idea.category },
        },
        ...h,
      ]);
      toast("Remix created and saved to your history", "success");
      setTimeout(() => document.getElementById("remix-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  const remixAgain = () => {
    if (!result) return;
    setPicks([{ kind: "idea", id: result.idea.id, title: result.idea.title, category: result.idea.category }]);
    setResult(null);
    setInstruction("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const d = result?.idea.details ?? {};

  return (
    <div className="space-y-12">
      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="rounded-3xl border border-line bg-surface p-5 md:p-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">Inputs · {picks.length}/4</p>
          <div className="mt-4 flex min-h-[120px] flex-wrap items-center gap-3" aria-live="polite">
            {picks.length === 0 ? <p className="text-[14px] text-ink-3">Add ideas from your vault or type any concept — a product, technology, field or problem.</p> : null}
            {picks.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                {i > 0 ? <Plus size={16} className="text-accent" aria-hidden /> : null}
                <span className="flex max-w-xs items-center gap-2 rounded-2xl border border-line-strong bg-bg-elev py-2.5 pl-4 pr-2 animate-pop">
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium text-ink">{p.kind === "idea" ? p.title : p.label}</span>
                    <span className="block font-mono text-[10.5px] uppercase tracking-wider text-ink-3">{p.kind === "idea" ? categoryLabel(p.category) : "Concept"}</span>
                  </span>
                  <button onClick={() => remove(i)} aria-label={`Remove ${p.kind === "idea" ? p.title : p.label}`} className="rounded-lg p-1 text-ink-3 hover:bg-surface-2 hover:text-ink">
                    <X size={14} />
                  </button>
                </span>
              </div>
            ))}
          </div>

          <form
            className="mt-5 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const c = concept.trim();
              if (c) add({ kind: "concept", label: c.slice(0, 120) });
              setConcept("");
            }}
          >
            <Input value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Add a concept, e.g. “satellite imagery” or “Duolingo”" disabled={full} aria-label="Add a concept" maxLength={120} />
            <Button type="submit" variant="secondary" disabled={full || !concept.trim()}>
              Add
            </Button>
          </form>

          <div className="mt-4">
            <p className="mb-2 text-[12px] text-ink-3">Or try a spark:</p>
            <div className="flex flex-wrap gap-2">
              {SPARKS.map(([a, b]) => (
                <button
                  key={a + b}
                  onClick={() => setPicks([{ kind: "concept", label: a }, { kind: "concept", label: b }])}
                  className="rounded-full border border-line px-3 py-1 text-[12.5px] text-ink-2 transition hover:border-line-strong hover:text-ink"
                >
                  {a} + {b}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="instruction" className="mb-1.5 block text-[13px] font-medium text-ink-2">
              Direction (optional)
            </label>
            <Textarea id="instruction" value={instruction} onChange={(e) => setInstruction(e.target.value)} maxLength={400} className="min-h-20" placeholder="e.g. make it work for teenagers; keep it under a weekend build; focus on a business model" />
          </div>

          {error ? (
            <div className="mt-4 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
              {error}
            </div>
          ) : null}

          <Button size="lg" className="mt-5 w-full sm:w-auto" onClick={run} loading={loading} disabled={picks.length < 2 || !aiEnabled}>
            {loading ? "Finding the connection…" : (
              <>
                <Shuffle size={16} /> Remix {picks.length >= 2 ? `${picks.length} inputs` : ""}
              </>
            )}
          </Button>
          {picks.length < 2 ? <p className="mt-2 text-[12px] text-ink-3">Add at least two inputs.</p> : null}
        </div>

        <aside className="rounded-3xl border border-line bg-bg-elev p-5">
          <p className="text-[14px] font-semibold text-ink">From your vault</p>
          <Input className="mt-3 h-9 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter saved ideas" aria-label="Filter saved ideas" />
          <ul className="mt-3 space-y-1">
            {filtered.map((l) => (
              <li key={l.id}>
                <button onClick={() => add({ kind: "idea", id: l.id, title: l.title, category: l.category })} disabled={full} className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left hover:bg-surface disabled:opacity-50">
                  <Plus size={14} className="shrink-0 text-ink-3" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] text-ink">{l.title}</span>
                    <span className="block text-[11px] text-ink-3">
                      {categoryLabel(l.category)}
                      {l.sourceKind === "remix" ? " · remix" : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {library.length === 0 ? (
            <p className="mt-2 text-[13px] leading-relaxed text-ink-3">
              Your vault is empty. Save ideas from{" "}
              <Link href="/discover" className="text-ink underline-offset-2 hover:underline">
                Discover
              </Link>{" "}
              or use the shuffle button on any card to send it here.
            </p>
          ) : null}
        </aside>
      </section>

      {loading ? (
        <div className="rounded-3xl border border-line bg-surface p-7">
          <div className="skeleton h-3 w-32" />
          <div className="skeleton mt-4 h-9 w-2/3" />
          <div className="skeleton mt-4 h-4 w-full" />
          <div className="skeleton mt-2 h-4 w-4/5" />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="skeleton h-24" />
            <div className="skeleton h-24" />
            <div className="skeleton h-24" />
          </div>
        </div>
      ) : null}

      {result ? (
        <section id="remix-result" className="scroll-mt-24 rounded-3xl border border-line bg-surface p-6 shadow-card animate-fade-up md:p-9">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="accent">
              <Shuffle size={11} /> Remix
            </Badge>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">{categoryLabel(result.idea.category)}</span>
            <Meta idea={result.idea} />
            <Badge tone={result.feasibility === "high" ? "success" : result.feasibility === "low" ? "danger" : "warn"}>Feasibility: {result.feasibility}</Badge>
          </div>
          <h2 className="mt-4 font-serif text-[2.2rem] leading-[1.06] text-ink md:text-[2.8rem]">{result.idea.title}</h2>
          <p className="mt-3 max-w-3xl text-[16px] leading-relaxed text-ink-2">{result.idea.summary}</p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {[
              ["1 · What was combined", d.combined?.length ? <ul className="space-y-1">{d.combined.map((c, i) => <li key={i}>— {c}</li>)}</ul> : null],
              ["2 · Why it could work", d.whyItWorks],
              ["3 · The opportunity", d.opportunity],
              ["4 · What makes it different", d.differentiation],
              ["5 · Technical feasibility", d.feasibility],
              ["6 · How to prototype it", d.prototype?.length ? <ol className="space-y-1">{d.prototype.map((c, i) => <li key={i}>{i + 1}. {c}</li>)}</ol> : null],
            ].map(([label, body]) =>
              body ? (
                <div key={label as string} className="rounded-2xl bg-bg-elev p-5">
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.13em] text-accent-text">{label}</p>
                  <div className="text-[14.5px] leading-relaxed text-ink-2">{body}</div>
                </div>
              ) : null,
            )}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={remixAgain}>
                <Shuffle size={15} /> Remix this further
              </Button>
              <Link href={`/build/new?idea=${result.idea.id}`} className={buttonClass("secondary")}>
                <Hammer size={15} /> Build it
              </Link>
              <Link href={`/idea/${result.idea.id}`} className={buttonClass("ghost")}>
                Open idea <ArrowRight size={15} />
              </Link>
            </div>
            <IdeaActionBar idea={result.idea} initial={{ liked: false, saved: false, hidden: false, interesting: false }} />
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-4 flex items-center gap-2">
          <History size={16} className="text-ink-3" />
          <h2 className="text-[17px] font-semibold text-ink">Remix history</h2>
        </div>
        {past.length === 0 ? (
          <EmptyState icon={<Sparkles size={20} />} title="No remixes yet" description="Your combinations will be kept here, so you can come back to them or remix a remix." />
        ) : (
          <ol className="space-y-3">
            {past.map((h) => (
              <li key={h.id}>
                <Link href={`/idea/${h.result.id}`} className="group block rounded-2xl border border-line bg-surface p-4 transition hover:border-line-strong md:p-5">
                  <div className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-ink-3">
                    {h.inputs.map((i, n) => (
                      <span key={n} className="flex items-center gap-1.5">
                        {n > 0 ? <Plus size={11} /> : null}
                        <span className="rounded-md bg-surface-2 px-2 py-0.5 text-ink-2">{i.title}</span>
                      </span>
                    ))}
                    {h.instruction ? <span className="truncate">· {h.instruction}</span> : null}
                    <span className="ml-auto font-mono text-[11px]">{new Date(h.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                  </div>
                  <p className={cx("mt-3 flex items-center gap-2 text-[16px] font-semibold text-ink group-hover:text-accent-text")}>
                    <ArrowRight size={15} className="text-accent" /> {h.result.title}
                  </p>
                  <p className="mt-1 line-clamp-2 pl-6 text-[13.5px] text-ink-2">{h.result.summary}</p>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
