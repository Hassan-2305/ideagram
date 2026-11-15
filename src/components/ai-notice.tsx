"use client";

import { KeyRound } from "lucide-react";
import { useApp } from "./providers";

/** Shown on AI-powered pages when the server has no Anthropic credentials. No fake output is ever produced. */
export function AiNotice({ feature, alternative }: { feature: string; alternative?: React.ReactNode }) {
  const { aiEnabled } = useApp();
  if (aiEnabled) return null;
  return (
    <div role="status" className="mb-6 flex gap-3 rounded-2xl border border-warn/30 bg-warn-soft px-4 py-3.5 text-sm text-warn">
      <KeyRound size={18} className="mt-0.5 shrink-0" />
      <div>
        <p className="font-medium">{feature} needs an AI key on this server.</p>
        <p className="mt-1 opacity-90">
          Add <code className="rounded bg-black/10 px-1 font-mono text-[12px]">ANTHROPIC_API_KEY</code> to <code className="rounded bg-black/10 px-1 font-mono text-[12px]">.env.local</code> and restart. Until then, requests will
          fail clearly instead of showing made-up results. {alternative}
        </p>
      </div>
    </div>
  );
}
