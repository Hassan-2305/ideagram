"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { api, errorMessage } from "@/lib/client";
import { useApp } from "@/components/providers";
import { Button, cx, Input, Label, Select, Textarea } from "@/components/ui";

const STEPS = ["The event", "Your team", "Judging"] as const;

export function HackathonWizard() {
  const router = useRouter();
  const { aiEnabled } = useApp();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({
    theme: "",
    hours: 24,
    difficulty: "",
    teamSize: 3,
    skills: "",
    technologies: "",
    hardware: "",
    budget: "",
    audience: "",
    judging: "",
    count: 5,
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  const canNext = step !== 0 || f.theme.trim().length >= 2;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ session: { id: string } }>("/api/hackathon", { body: { ...f, theme: f.theme.trim() } });
      router.push(`/hackathon/${r.session.id}`);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-line bg-surface p-5 md:p-8">
      <ol className="mb-8 flex items-center gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => (i < step || canNext) && setStep(i)}
              aria-current={i === step ? "step" : undefined}
              className={cx("flex items-center gap-2 text-[13px]", i === step ? "font-medium text-ink" : i < step ? "text-ink-2" : "text-ink-3")}
            >
              <span className={cx("grid h-6 w-6 place-items-center rounded-full font-mono text-[11px]", i <= step ? "bg-ink text-bg" : "bg-surface-3 text-ink-3")}>{i + 1}</span>
              <span className="hidden sm:inline">{s}</span>
            </button>
            {i < STEPS.length - 1 ? <span className={cx("h-px flex-1", i < step ? "bg-ink" : "bg-line")} /> : null}
          </li>
        ))}
      </ol>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step >= STEPS.length - 1) submit();
          else if (canNext) setStep(step + 1);
        }}
      >
        {step === 0 ? (
          <div className="space-y-5 animate-fade-in">
            <div>
              <Label htmlFor="theme">Hackathon theme or track</Label>
              <Textarea id="theme" required value={f.theme} onChange={(e) => set("theme", e.target.value)} maxLength={300} className="min-h-24" placeholder="e.g. “Climate resilience for cities”, “Open track”, “Tools for educators”" autoFocus />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="hours">Hours available to build</Label>
                <Select id="hours" value={f.hours} onChange={(e) => set("hours", Number(e.target.value))}>
                  {[6, 12, 24, 36, 48, 72, 168].map((h) => (
                    <option key={h} value={h}>
                      {h === 168 ? "1 week" : `${h} hours`}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="difficulty">Preferred difficulty</Label>
                <Select id="difficulty" value={f.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
                  <option value="">Match our team</option>
                  <option value="safe and polished">Safe and polished</option>
                  <option value="ambitious">Ambitious</option>
                  <option value="moonshot">Moonshot</option>
                </Select>
              </div>
            </div>
          </div>
        ) : step === 1 ? (
          <div className="space-y-5 animate-fade-in">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="team">Team size</Label>
                <Select id="team" value={f.teamSize} onChange={(e) => set("teamSize", Number(e.target.value))}>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n === 1 ? "Solo" : `${n} people`}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="budget">Budget</Label>
                <Select id="budget" value={f.budget} onChange={(e) => set("budget", e.target.value)}>
                  <option value="">None / free tiers only</option>
                  <option value="under $50">Under $50</option>
                  <option value="under $200">Under $200</option>
                  <option value="sponsor credits available">Sponsor credits available</option>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="skills">Team skills</Label>
              <Textarea id="skills" value={f.skills} onChange={(e) => set("skills", e.target.value)} maxLength={400} className="min-h-20" placeholder="e.g. 2 frontend (React), 1 Python/ML, 1 designer" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="tech">Technologies available or required</Label>
                <Input id="tech" value={f.technologies} onChange={(e) => set("technologies", e.target.value)} maxLength={300} placeholder="e.g. sponsor APIs, Supabase, Gemini" />
              </div>
              <div>
                <Label htmlFor="hw">Hardware available</Label>
                <Input id="hw" value={f.hardware} onChange={(e) => set("hardware", e.target.value)} maxLength={200} placeholder="e.g. laptops only, Raspberry Pi, Arduino kit" />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5 animate-fade-in">
            <div>
              <Label htmlFor="audience">Target audience (optional)</Label>
              <Input id="audience" value={f.audience} onChange={(e) => set("audience", e.target.value)} maxLength={200} placeholder="e.g. first-year students, small farmers" />
            </div>
            <div>
              <Label htmlFor="judging">Judging criteria</Label>
              <Textarea id="judging" value={f.judging} onChange={(e) => set("judging", e.target.value)} maxLength={400} className="min-h-24" placeholder="Paste them from the event page, e.g. impact 30%, technical complexity 30%, design 20%, presentation 20%" />
            </div>
            <div>
              <Label htmlFor="count">How many ideas</Label>
              <Select id="count" value={f.count} onChange={(e) => set("count", Number(e.target.value))} className="sm:w-48">
                {[3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} ideas
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {error ? (
          <p role="alert" className="mt-5 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
        {busy ? <p className="mt-5 text-[13px] text-ink-3">Ranking ideas against your constraints with Claude Opus. This takes about a minute — it is thinking through feasibility, roadmaps and judge questions.</p> : null}

        <div className="mt-8 flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || busy}>
            <ArrowLeft size={15} /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="submit" disabled={!canNext}>
              Next <ArrowRight size={15} />
            </Button>
          ) : (
            <Button type="submit" size="lg" loading={busy} disabled={!aiEnabled}>
              {busy ? "Generating…" : (
                <>
                  <Sparkles size={16} /> Find project ideas
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
