"use client";

import { useEffect, useState } from "react";
import { Check, Moon, Sun } from "lucide-react";
import { cx } from "./ui";

export const PALETTES = [
  { id: "ocean", name: "Ocean", colors: ["#34d399", "#14b8a6", "#0ea5e9"], base: "#03161a" },
  { id: "ember", name: "Ember", colors: ["#fb7185", "#f97316", "#fbbf24"], base: "#140b08" },
  { id: "rose", name: "Rosé", colors: ["#fda4af", "#f472b6", "#c084fc"], base: "#140810" },
  { id: "graphite", name: "Graphite", colors: ["#d9f99d", "#bef264", "#a3e635"], base: "#0b0c0d" },
  { id: "aurora", name: "Aurora", colors: ["#8b5cf6", "#6366f1", "#06b6d4"], base: "#07061a" },
] as const;

type Prefs = { palette: string; theme: "dark" | "light"; covers: "palette" | "vivid" };

function read(): Prefs {
  const d = document.documentElement.dataset;
  return {
    palette: d.palette ?? "ocean",
    theme: d.theme === "light" ? "light" : "dark",
    covers: d.covers === "vivid" ? "vivid" : "palette",
  };
}

function apply(next: Prefs) {
  const d = document.documentElement.dataset;
  d.palette = next.palette;
  d.theme = next.theme;
  d.covers = next.covers;
  try {
    localStorage.setItem("ig.palette", next.palette);
    localStorage.setItem("ig.theme", next.theme);
    localStorage.setItem("ig.covers", next.covers);
  } catch {
    /* ignore */
  }
}

export function useThemePrefs() {
  const [prefs, setPrefs] = useState<Prefs>({ palette: "ocean", theme: "dark", covers: "palette" });
  useEffect(() => {
    // Hydration-safe: the applied theme lives on <html>, set before paint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefs(read());
  }, []);
  const update = (patch: Partial<Prefs>) => {
    const next = { ...read(), ...patch };
    apply(next);
    setPrefs(next);
  };
  return { prefs, update };
}

/** Palette swatches + mode + cover style. Used in the sidebar popover, mobile sheet and Settings. */
export function ThemePicker({ compact }: { compact?: boolean }) {
  const { prefs, update } = useThemePrefs();
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2.5 text-[13px] font-bold text-ink">Color theme</p>
        <div className={cx("grid gap-2", compact ? "grid-cols-5" : "grid-cols-2 sm:grid-cols-5")}>
          {PALETTES.map((p) => {
            const on = prefs.palette === p.id;
            return (
              <button
                key={p.id}
                onClick={() => update({ palette: p.id })}
                aria-pressed={on}
                aria-label={`${p.name} theme`}
                title={p.name}
                className={cx("group flex flex-col items-center gap-1.5 rounded-2xl p-1.5 transition", on ? "bg-surface-3" : "hover:bg-surface-2")}
              >
                <span
                  className={cx("relative grid aspect-square w-full place-items-center overflow-hidden rounded-xl ring-2 transition", on ? "ring-[var(--accent)]" : "ring-transparent")}
                  style={{
                    background: `radial-gradient(70% 70% at 25% 20%, ${p.colors[0]}, transparent 70%), radial-gradient(70% 70% at 80% 85%, ${p.colors[2]}, transparent 70%), linear-gradient(135deg, ${p.colors[1]}, ${p.base})`,
                  }}
                >
                  {on ? (
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-black shadow">
                      <Check size={14} strokeWidth={3} />
                    </span>
                  ) : null}
                </span>
                {!compact ? <span className={cx("text-[12.5px]", on ? "font-bold text-ink" : "text-ink-2")}>{p.name}</span> : null}
              </button>
            );
          })}
        </div>
        {compact ? <p className="mt-2 text-center text-[12px] text-ink-3">{PALETTES.find((p) => p.id === prefs.palette)?.name}</p> : null}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-2 text-[13px] font-bold text-ink">Mode</p>
          <div className="glass flex rounded-full p-1">
            {(
              [
                ["dark", Moon, "Dark"],
                ["light", Sun, "Light"],
              ] as const
            ).map(([v, Icon, label]) => (
              <button key={v} onClick={() => update({ theme: v })} aria-pressed={prefs.theme === v} className={cx("flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full text-[12.5px] font-semibold transition", prefs.theme === v ? "bg-brand" : "text-ink-2")}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[13px] font-bold text-ink">Covers</p>
          <div className="glass flex rounded-full p-1">
            {(
              [
                ["palette", "Matched"],
                ["vivid", "Vivid"],
              ] as const
            ).map(([v, label]) => (
              <button key={v} onClick={() => update({ covers: v })} aria-pressed={prefs.covers === v} className={cx("h-8 flex-1 rounded-full text-[12.5px] font-semibold transition", prefs.covers === v ? "bg-brand" : "text-ink-2")}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
