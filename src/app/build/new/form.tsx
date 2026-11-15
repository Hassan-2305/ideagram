"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Hammer } from "lucide-react";
import { api, errorMessage } from "@/lib/client";
import { useApp } from "@/components/providers";
import { Button, Label, Textarea } from "@/components/ui";

export function NewPlanForm({ ideaId }: { ideaId: string }) {
  const router = useRouter();
  const { aiEnabled, toast } = useApp();
  const [context, setContext] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="rounded-2xl border border-line bg-surface p-5 md:p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          const r = await api<{ project: { id: string } }>("/api/projects", { body: { ideaId, context: context.trim() } });
          toast("Your plan is ready", "success");
          router.push(`/build/${r.project.id}`);
        } catch (err) {
          setError(errorMessage(err));
          setBusy(false);
        }
      }}
    >
      <Label htmlFor="context">Tell the planner about your situation (optional)</Label>
      <Textarea
        id="context"
        value={context}
        onChange={(e) => setContext(e.target.value)}
        maxLength={600}
        className="min-h-28"
        placeholder="e.g. Solo, evenings only, ~6 weeks. Comfortable with TypeScript and Postgres, new to mobile. Want to launch to a small Discord community."
      />
      {error ? (
        <p role="alert" className="mt-3 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {busy ? <p className="mt-3 text-[13px] text-ink-3">Claude Opus is drafting requirements, architecture, schema, API and milestones. This takes about a minute.</p> : null}
      <Button type="submit" size="lg" className="mt-4" loading={busy} disabled={!aiEnabled}>
        <Hammer size={16} /> {busy ? "Planning…" : "Generate build plan"}
      </Button>
    </form>
  );
}
