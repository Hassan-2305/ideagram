"use client";

import { useState } from "react";
import { ChevronDown, FlaskConical, Sparkles } from "lucide-react";
import { api, errorMessage } from "@/lib/client";
import type { Idea } from "@/lib/types";
import type { IdeaState } from "@/components/idea-actions";
import { GeneratedIdeaCard } from "@/components/generated-idea";
import { useApp } from "@/components/providers";
import { Button, cx, EmptyState, Input, Label, Select, Textarea } from "@/components/ui";

const STYLES = [
  { id: "practical", label: "Practical", hint: "Solves a frequent, painful problem" },
  { id: "unconventional", label: "Unconventional", hint: "An unexpected angle or user" },
  { id: "experimental", label: "Experimental", hint: "New capabilities, higher risk" },
  { id: "startup", label: "Startup", hint: "Who pays, and why now" },
  { id: "hackathon", label: "Hackathon", hint: "Demoable in a weekend" },
  { id: "beginner", label: "Beginner", hint: "Teaches the fundamentals" },
  { id: "advanced", label: "Advanced", hint: "Hard systems problems" },
  { id: "social-impact", label: "Social impact", hint: "Helps an underserved group" },
  { id: "unrelated-tech", label: "Unrelated mash-up", hint: "Fields that only work together" },
] as const;

const EMPTY: IdeaState = { liked: false, saved: false, hidden: false, interesting: false };

export function LabWorkspace({ initialTopic, history, historyStates }: { initialTopic: string; history: Idea[]; historyStates: Record<string, IdeaState> }) {
  const { toast, aiEnabled } = useApp();
  const [style, setStyle] = useState<(typeof STYLES)[number]["id"]>("practical");
  const [topic, setTopic] = useState(initialTopic);
  const [advanced, setAdvanced] = useState(false);
  const [f, setF] = useState({ industry: "", technology: "", skillLevel: "", time: "", budget: "", teamSize: "", platform: "", constraints: "", problemCategory: "" });
  const [count, setCount] = useState(3);
  const [results, setResults] = useState<{ ideas: Idea[]; states: Record<string, IdeaState> } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function generate(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { style, count };
      if (topic.trim()) payload.topic = topic.trim();
      for (const [k, v] of Object.entries(f)) if (v.trim()) payload[k] = v.trim();
      const r = await api<{ ideas: Idea[]; states: Record<string, IdeaState> }>("/api/lab/generate", { body: payload });
      setResults(r);
      toast(`${r.ideas.length} ideas generated — saved to your AI concepts`, "success");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <form onSubmit={generate} className="space-y-5 lg:sticky lg:top-20 lg:self-start">
        <div>
          <Label htmlFor="topic">What should the ideas be about?</Label>
          <Textarea
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={200}
            className="min-h-24"
            placeholder="e.g. helping night-shift nurses, local-first software, my city's flooding problem…"
          />
        </div>
        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-ink-2">Style</legend>
          <div className="grid grid-cols-2 gap-2">
            {STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStyle(s.id)}
                aria-pressed={style === s.id}
                className={cx(
                  "rounded-xl border px-3 py-2.5 text-left transition-colors",
                  style === s.id ? "border-ink bg-surface shadow-soft" : "border-line bg-bg-elev hover:border-line-strong",
                )}
              >
                <span className="block text-[13.5px] font-medium text-ink">{s.label}</span>
                <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-3">{s.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <button type="button" onClick={() => setAdvanced((a) => !a)} aria-expanded={advanced} className="flex w-full items-center justify-between rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink-2">
          Constraints: skills, time, budget, platform…
          <ChevronDown size={15} className={cx("transition-transform", advanced && "rotate-180")} />
        </button>
        {advanced ? (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            <div className="col-span-2">
              <Label htmlFor="technology">Technology to use</Label>
              <Input id="technology" value={f.technology} onChange={set("technology")} maxLength={150} placeholder="e.g. WebGPU, ESP32, Whisper" />
            </div>
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" value={f.industry} onChange={set("industry")} maxLength={100} placeholder="e.g. agriculture" />
            </div>
            <div>
              <Label htmlFor="skill">Skill level</Label>
              <Select id="skill" value={f.skillLevel} onChange={set("skillLevel")}>
                <option value="">Any</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="time">Available time</Label>
              <Select id="time" value={f.time} onChange={set("time")}>
                <option value="">Any</option>
                <option>A few hours</option>
                <option>One weekend</option>
                <option>1–2 weeks</option>
                <option>1–3 months</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="budget">Budget</Label>
              <Select id="budget" value={f.budget} onChange={set("budget")}>
                <option value="">Any</option>
                <option>Zero</option>
                <option>Under $50</option>
                <option>Under $500</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="team">Team size</Label>
              <Select id="team" value={f.teamSize} onChange={set("teamSize")}>
                <option value="">Any</option>
                <option>Solo</option>
                <option>2–3 people</option>
                <option>4–6 people</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="platform">Platform</Label>
              <Select id="platform" value={f.platform} onChange={set("platform")}>
                <option value="">Any</option>
                <option>Web</option>
                <option>Mobile</option>
                <option>Desktop</option>
                <option>CLI / developer tool</option>
                <option>Hardware / IoT</option>
                <option>Browser extension</option>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="pcat">Problem category</Label>
              <Input id="pcat" value={f.problemCategory} onChange={set("problemCategory")} maxLength={100} placeholder="e.g. accessibility, waste, loneliness" />
            </div>
            <div className="col-span-2">
              <Label htmlFor="constraints">Other constraints</Label>
              <Textarea id="constraints" value={f.constraints} onChange={set("constraints")} maxLength={600} className="min-h-20" placeholder="e.g. must work offline; no user accounts; uses public datasets only" />
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <Select aria-label="Number of ideas" value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-28">
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} idea{n > 1 ? "s" : ""}
              </option>
            ))}
          </Select>
          <Button type="submit" size="lg" className="flex-1" loading={loading} disabled={!aiEnabled}>
            {loading ? "Thinking…" : (
              <>
                <Sparkles size={16} /> Generate
              </>
            )}
          </Button>
        </div>
        <p className="text-[12px] leading-relaxed text-ink-3">Uses Claude Sonnet for generation. Generated ideas are private to you and appear under “Generated by me”.</p>
      </form>

      <div className="min-w-0" aria-live="polite">
        {error ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
            <Button size="sm" variant="ghost" onClick={() => generate()}>
              Try again
            </Button>
          </div>
        ) : null}
        {loading ? (
          <div className="space-y-4">
            <p className="text-[13px] text-ink-3">Generating {count} distinct ideas — this usually takes 15–40 seconds.</p>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-line bg-surface p-6">
                <div className="skeleton h-3 w-28" />
                <div className="skeleton mt-4 h-7 w-3/4" />
                <div className="skeleton mt-3 h-4 w-full" />
                <div className="skeleton mt-2 h-4 w-5/6" />
                <div className="skeleton mt-5 h-16 w-full" />
              </div>
            ))}
          </div>
        ) : results ? (
          <div className="space-y-4">
            {results.ideas.map((i, n) => (
              <GeneratedIdeaCard key={i.id} idea={i} state={results.states[i.id] ?? EMPTY} index={n} defaultOpen={n === 0} />
            ))}
          </div>
        ) : history.length ? (
          <div>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">Your recent generations</p>
            <div className="space-y-4">
              {history.slice(0, 6).map((i, n) => (
                <GeneratedIdeaCard key={i.id} idea={i} state={historyStates[i.id] ?? EMPTY} index={n} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<FlaskConical size={20} />}
            title="Your lab bench is empty"
            description="Start with a topic you care about, or leave it blank and let the style lead. Add constraints for ideas that actually fit your time and skills."
          />
        )}
      </div>
    </div>
  );
}
