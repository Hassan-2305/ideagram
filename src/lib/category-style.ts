import {
  Bot,
  Briefcase,
  Code2,
  Cpu,
  FlaskConical,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Leaf,
  Lightbulb,
  Palette,
  Rocket,
  Timer,
  Wallet,
  Workflow,
  GitFork,
  type LucideIcon,
} from "lucide-react";

/** Per-category gradient stops (three colours) and icon for cover art and story rings. */
export const CATEGORY_STYLE: Record<string, { from: string; via: string; to: string; icon: LucideIcon }> = {
  "ai-ml": { from: "#7c3aed", via: "#4f46e5", to: "#06b6d4", icon: Bot },
  devtools: { from: "#0ea5e9", via: "#6366f1", to: "#312e81", icon: Code2 },
  productivity: { from: "#f59e0b", via: "#ef4444", to: "#9333ea", icon: Timer },
  startups: { from: "#ec4899", via: "#8b5cf6", to: "#1e1b4b", icon: Rocket },
  education: { from: "#22c55e", via: "#0ea5e9", to: "#4338ca", icon: GraduationCap },
  healthcare: { from: "#f43f5e", via: "#db2777", to: "#7c3aed", icon: HeartPulse },
  sustainability: { from: "#10b981", via: "#14b8a6", to: "#0e7490", icon: Leaf },
  finance: { from: "#facc15", via: "#22c55e", to: "#0f766e", icon: Wallet },
  hardware: { from: "#f97316", via: "#e11d48", to: "#581c87", icon: Cpu },
  automation: { from: "#06b6d4", via: "#3b82f6", to: "#7c3aed", icon: Workflow },
  design: { from: "#f472b6", via: "#a855f7", to: "#6366f1", icon: Palette },
  "social-impact": { from: "#fb923c", via: "#f43f5e", to: "#be185d", icon: HandHeart },
  experimental: { from: "#a3e635", via: "#06b6d4", to: "#7c3aed", icon: FlaskConical },
  "open-source": { from: "#38bdf8", via: "#818cf8", to: "#c026d3", icon: GitFork },
  everyday: { from: "#fbbf24", via: "#fb7185", to: "#8b5cf6", icon: Lightbulb },
};

export const FALLBACK_STYLE = { from: "#8b5cf6", via: "#6366f1", to: "#06b6d4", icon: Briefcase };

export function categoryStyle(slug: string) {
  return CATEGORY_STYLE[slug] ?? FALLBACK_STYLE;
}

/** Small deterministic hash so each idea's cover has its own composition. */
export function hashOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
