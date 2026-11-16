"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { api, errorMessage } from "@/lib/client";
import { CATEGORIES } from "@/lib/types";
import { useApp } from "./providers";
import { Button, Chip, cx, Input, Label } from "./ui";

export interface Prefs {
  categories: string[];
  technologies: string[];
  difficulty: string | null;
  exploration: number;
  personalization: boolean;
}

const TECH_SUGGESTIONS = ["Python", "TypeScript", "React", "LLMs", "Computer vision", "Rust", "ESP32", "Raspberry Pi", "Swift", "Kotlin", "WebGPU", "Postgres", "Unity", "Solidity"];

export function PreferencesForm({ initial, mode, onDone }: { initial: Prefs; mode: "onboarding" | "settings"; onDone?: () => void }) {
  const { toast } = useApp();
  const router = useRouter();
  const [p, setP] = useState(initial);
  const [tech, setTech] = useState("");
  const [busy, setBusy] = useState(false);

  const toggleCat = (slug: string) => setP((x) => ({ ...x, categories: x.categories.includes(slug) ? x.categories.filter((c) => c !== slug) : [...x.categories, slug] }));
  const addTech = (t: string) => {
    const v = t.trim().slice(0, 40);
    if (v && !p.technologies.some((x) => x.toLowerCase() === v.toLowerCase())) setP((x) => ({ ...x, technologies: [...x.technologies, v].slice(0, 20) }));
    setTech("");
  };

  const save = async () => {
    setBusy(true);
    try {
      await api("/api/preferences", { method: "PATCH", body: { ...p, ...(mode === "onboarding" ? { onboarded: true } : {}) } });
      toast(mode === "onboarding" ? "Your gym is ready" : "Preferences saved", "success");
      if (onDone) onDone();
      router.refresh();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="text-[15px] font-semibold text-ink">What are you curious about?</legend>
        <p className="mt-1 text-[13.5px] text-ink-3">Pick a few. You&apos;ll still see other categories — that&apos;s on purpose.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip key={c.slug} active={p.categories.includes(c.slug)} onClick={() => toggleCat(c.slug)}>
              {c.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[15px] font-semibold text-ink">Technologies you use or want to learn</legend>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {p.technologies.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-brand py-1 pl-3 pr-1.5 text-[13px] text-white">
              {t}
              <button onClick={() => setP((x) => ({ ...x, technologies: x.technologies.filter((y) => y !== t) }))} aria-label={`Remove ${t}`} className="rounded-full p-0.5 opacity-70 hover:opacity-100">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <form
          className="mt-3 flex max-w-md gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addTech(tech);
          }}
        >
          <Input value={tech} onChange={(e) => setTech(e.target.value)} placeholder="Type and press Enter" maxLength={40} className="h-10" aria-label="Add technology" />
          <Button type="submit" variant="secondary">
            Add
          </Button>
        </form>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {TECH_SUGGESTIONS.filter((t) => !p.technologies.includes(t)).map((t) => (
            <button key={t} onClick={() => addTech(t)} className="rounded-full border border-dashed border-line-strong px-2.5 py-0.5 text-[12.5px] text-ink-3 hover:text-ink">
              + {t}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[15px] font-semibold text-ink">Preferred difficulty</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {[null, "beginner", "intermediate", "advanced"].map((d) => (
            <Chip key={d ?? "any"} active={p.difficulty === d} onClick={() => setP((x) => ({ ...x, difficulty: d }))}>
              {d ? d[0].toUpperCase() + d.slice(1) : "No preference"}
            </Chip>
          ))}
        </div>
      </fieldset>

      {mode === "settings" ? (
        <>
          <div>
            <Label htmlFor="explore">Exploration: how often to show blind spots</Label>
            <div className="flex max-w-md items-center gap-4">
              <input
                id="explore"
                type="range"
                min={0}
                max={0.6}
                step={0.05}
                value={p.exploration}
                onChange={(e) => setP((x) => ({ ...x, exploration: Number(e.target.value) }))}
                className="flex-1 accent-[var(--accent)]"
              />
              <span className="w-24 font-mono text-[13px] text-ink-2">{Math.round(p.exploration * 100)}% of feed</span>
            </div>
            <p className="mt-1 text-[12.5px] text-ink-3">Higher values mix in more categories you haven&apos;t engaged with.</p>
          </div>
          <label className="flex max-w-md cursor-pointer items-start gap-3">
            <input type="checkbox" checked={p.personalization} onChange={(e) => setP((x) => ({ ...x, personalization: e.target.checked }))} className="mt-1 h-4 w-4 accent-[var(--accent)]" />
            <span>
              <span className="block text-[14px] font-medium text-ink">Personalize my feed</span>
              <span className="block text-[12.5px] text-ink-3">When off, “For you” ranks by quality and freshness only.</span>
            </span>
          </label>
        </>
      ) : null}

      <div className={cx("flex gap-2", mode === "onboarding" && "pt-2")}>
        <Button size={mode === "onboarding" ? "lg" : "md"} onClick={save} loading={busy}>
          {mode === "onboarding" ? "Start exploring" : "Save preferences"}
        </Button>
        {mode === "onboarding" ? (
          <Button size="lg" variant="ghost" onClick={() => (onDone ? onDone() : router.push("/"))}>
            Skip for now
          </Button>
        ) : null}
      </div>
    </div>
  );
}
