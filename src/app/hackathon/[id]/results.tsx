"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Columns3, Hammer, Star } from "lucide-react";
import { api, errorMessage } from "@/lib/client";
import type { HackathonIdea } from "@/lib/ai/schemas";
import { categoryLabel } from "@/lib/types";
import { useApp } from "@/components/providers";
import { Badge, Button, cx } from "@/components/ui";

const CRITERIA: [keyof HackathonIdea["scores"], string][] = [
  ["themeRelevance", "Theme relevance"],
  ["feasibility", "Feasibility"],
  ["novelty", "Technical novelty"],
  ["demoPotential", "Demo potential"],
  ["significance", "Problem significance"],
  ["timeFit", "Time fit"],
  ["differentiation", "Differentiation"],
];

export function overall(i: HackathonIdea) {
  const vals = CRITERIA.map(([k]) => i.scores[k].score);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function ScoreBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3" aria-hidden>
      <div className={cx("h-full rounded-full", value >= 8 ? "bg-success" : value >= 5 ? "bg-accent" : "bg-danger")} style={{ width: `${value * 10}%` }} />
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.13em] text-ink-3">{label}</p>
      <div className="text-[14px] leading-relaxed text-ink-2">{children}</div>
    </div>
  );
}

export function HackathonResults({ sessionId, ideas, initialShortlist }: { sessionId: string; ideas: HackathonIdea[]; initialShortlist: number[] }) {
  const router = useRouter();
  const { toast, aiEnabled } = useApp();
  const [shortlist, setShortlist] = useState<number[]>(initialShortlist);
  const [open, setOpen] = useState<number | null>(0);
  const [compare, setCompare] = useState(false);
  const [building, setBuilding] = useState<number | null>(null);

  const ranked = ideas.map((idea, index) => ({ idea, index, score: overall(idea) })).sort((a, b) => b.score - a.score);

  const toggle = async (i: number) => {
    const next = shortlist.includes(i) ? shortlist.filter((x) => x !== i) : [...shortlist, i];
    setShortlist(next);
    try {
      await api(`/api/hackathon/${sessionId}`, { method: "PATCH", body: { shortlist: next } });
    } catch (e) {
      setShortlist(shortlist);
      toast(errorMessage(e), "error");
    }
  };

  const build = async (i: number) => {
    setBuilding(i);
    try {
      const r = await api<{ projectId: string }>(`/api/hackathon/${sessionId}/build`, { body: { index: i } });
      toast("Implementation plan ready", "success");
      router.push(`/build/${r.projectId}`);
    } catch (e) {
      toast(errorMessage(e), "error");
      setBuilding(null);
    }
  };

  const listed = ranked.filter((r) => shortlist.includes(r.index));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-ink-3">
          {ideas.length} ideas, ranked by average score · {shortlist.length} shortlisted
        </p>
        <Button variant={compare ? "primary" : "secondary"} onClick={() => setCompare((c) => !c)} disabled={listed.length < 2} title={listed.length < 2 ? "Star at least two ideas to compare" : undefined}>
          <Columns3 size={15} /> {compare ? "Back to list" : `Compare shortlist (${listed.length})`}
        </Button>
      </div>

      {compare && listed.length >= 2 ? (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface animate-fade-in">
          <table className="w-full min-w-[640px] text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-line">
                <th className="w-44 p-4 font-mono text-[11px] font-normal uppercase tracking-wider text-ink-3">Criterion</th>
                {listed.map((r) => (
                  <th key={r.index} className="p-4 align-bottom font-semibold text-ink">
                    {r.idea.title}
                    <span className="mt-1 block font-mono text-[12px] font-normal text-accent-text">{r.score.toFixed(1)} / 10</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CRITERIA.map(([k, label]) => {
                const best = Math.max(...listed.map((r) => r.idea.scores[k].score));
                return (
                  <tr key={k} className="border-b border-line align-top last:border-0">
                    <td className="p-4 text-ink-2">{label}</td>
                    {listed.map((r) => (
                      <td key={r.index} className="p-4">
                        <span className={cx("font-mono text-[13px]", r.idea.scores[k].score === best ? "font-semibold text-ink" : "text-ink-2")}>{r.idea.scores[k].score}</span>
                        <p className="mt-1 text-[12.5px] leading-snug text-ink-3">{r.idea.scores[k].why}</p>
                      </td>
                    ))}
                  </tr>
                );
              })}
              <tr className="border-t border-line align-top">
                <td className="p-4 text-ink-2">Biggest risk</td>
                {listed.map((r) => (
                  <td key={r.index} className="p-4 text-[12.5px] text-ink-2">
                    {r.idea.risks[0]}
                  </td>
                ))}
              </tr>
              <tr className="align-top">
                <td className="p-4" />
                {listed.map((r) => (
                  <td key={r.index} className="p-4">
                    <Button size="sm" onClick={() => build(r.index)} loading={building === r.index} disabled={building !== null || !aiEnabled}>
                      <Hammer size={14} /> Plan this one
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <ol className="space-y-4">
          {ranked.map(({ idea, index, score }, rank) => {
            const isOpen = open === index;
            const starred = shortlist.includes(index);
            return (
              <li key={index} className={cx("rounded-2xl border bg-surface shadow-soft transition-colors animate-fade-up", starred ? "border-accent/50" : "border-line")} style={{ animationDelay: `${rank * 60}ms` }}>
                <div className="flex items-start gap-4 p-5 md:p-6">
                  <div className="hidden w-14 shrink-0 text-center sm:block">
                    <p className="font-mono text-[11px] text-ink-3">#{rank + 1}</p>
                    <p className="mt-1 font-serif text-3xl text-ink">{score.toFixed(1)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-ink-3">{categoryLabel(idea.category)}</span>
                      <Badge>{idea.difficulty}</Badge>
                      <span className="font-mono text-[12px] text-accent-text sm:hidden">
                        #{rank + 1} · {score.toFixed(1)}
                      </span>
                    </div>
                    <h3 className="mt-2 text-[19px] font-semibold leading-snug text-ink">{idea.title}</h3>
                    <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">{idea.overview}</p>
                    <p className="mt-3 text-[13.5px] text-ink">
                      <span className="font-medium text-accent-text">USP · </span>
                      {idea.usp}
                    </p>
                  </div>
                  <button
                    onClick={() => toggle(index)}
                    aria-pressed={starred}
                    aria-label={starred ? "Remove from shortlist" : "Add to shortlist"}
                    className={cx("grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition", starred ? "border-accent bg-accent-soft text-accent-text" : "border-line text-ink-3 hover:text-ink")}
                  >
                    <Star size={17} fill={starred ? "currentColor" : "none"} />
                  </button>
                </div>

                <div className="grid gap-x-6 gap-y-3 border-t border-line px-5 py-4 sm:grid-cols-2 md:px-6 lg:grid-cols-4">
                  {CRITERIA.map(([k, label]) => (
                    <div key={k} title={idea.scores[k].why}>
                      <div className="mb-1 flex justify-between text-[12px]">
                        <span className="text-ink-3">{label}</span>
                        <span className="font-mono text-ink">{idea.scores[k].score}</span>
                      </div>
                      <ScoreBar value={idea.scores[k].score} />
                    </div>
                  ))}
                </div>

                {isOpen ? (
                  <div className="grid gap-7 border-t border-line p-5 animate-fade-in md:grid-cols-2 md:p-6">
                    <Detail label="Problem">{idea.problem}</Detail>
                    <Detail label="Solution">{idea.solution}</Detail>
                    <Detail label="MVP">
                      <ul className="space-y-1">{idea.mvp.map((m, i) => <li key={i}>— {m}</li>)}</ul>
                    </Detail>
                    <Detail label="Architecture">{idea.architecture}</Detail>
                    <Detail label="Recommended stack">
                      <div className="flex flex-wrap gap-1.5">
                        {idea.stack.map((s) => (
                          <span key={s} className="rounded-md border border-line px-2 py-0.5 text-[12px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </Detail>
                    <Detail label="Roadmap">
                      <ol className="space-y-1.5">
                        {idea.roadmap.map((r, i) => (
                          <li key={i} className="flex gap-3">
                            <span className="w-20 shrink-0 font-mono text-[12px] text-ink-3">{r.hours}</span>
                            <span>{r.goal}</span>
                          </li>
                        ))}
                      </ol>
                    </Detail>
                    <Detail label="Task division">
                      <ul className="space-y-2">
                        {idea.taskDivision.map((t, i) => (
                          <li key={i}>
                            <span className="font-medium text-ink">{t.role}: </span>
                            {t.tasks.join("; ")}
                          </li>
                        ))}
                      </ul>
                    </Detail>
                    <Detail label="Demo strategy">{idea.demoStrategy}</Detail>
                    <div className="md:col-span-2">
                      <Detail label="Questions judges will likely ask">
                        <dl className="grid gap-3 md:grid-cols-2">
                          {idea.judgeQuestions.map((q, i) => (
                            <div key={i} className="rounded-xl bg-bg-elev p-3.5">
                              <dt className="font-medium text-ink">{q.question}</dt>
                              <dd className="mt-1 text-[13px]">{q.answer}</dd>
                            </div>
                          ))}
                        </dl>
                      </Detail>
                    </div>
                    <Detail label="Risks">
                      <ul className="space-y-1">{idea.risks.map((r, i) => <li key={i}>— {r}</li>)}</ul>
                    </Detail>
                    <Detail label="Fallback plan">{idea.fallbackPlan}</Detail>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2 md:px-4">
                  <button onClick={() => setOpen(isOpen ? null : index)} aria-expanded={isOpen} className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] text-ink-2 hover:bg-surface-2 hover:text-ink">
                    <ChevronDown size={15} className={cx("transition-transform", isOpen && "rotate-180")} />
                    {isOpen ? "Hide details" : "Roadmap, tasks, demo & judge Q&A"}
                  </button>
                  <Button size="sm" variant="secondary" onClick={() => build(index)} loading={building === index} disabled={building !== null || !aiEnabled}>
                    <Hammer size={14} /> Generate implementation plan
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
