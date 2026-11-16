import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getPreferences } from "@/lib/repo/prefs";
import { aiConfigured, modelFor, usageSummary } from "@/lib/ai/client";
import { sourceStatus } from "@/lib/ingest";
import { Badge, Card, PageHeader } from "@/components/ui";
import { PreferencesForm } from "@/components/preferences-form";
import { ResetPersonalization } from "./reset";
import { ThemePicker } from "@/components/theme-picker";

export const metadata: Metadata = { title: "Settings" };

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 border-t border-line py-10 lg:grid-cols-[260px_1fr]">
      <div>
        <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-1 text-[13.5px] leading-relaxed text-ink-3">{description}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const user = await requireUser("/settings");
  const prefs = getPreferences(user.id);
  const usage = usageSummary(user.id);
  const totalCost = usage.reduce((a, b) => a + (b.cost ?? 0), 0);
  const sources = sourceStatus();
  const ai = aiConfigured();

  return (
    <div className="max-w-5xl">
      <PageHeader eyebrow="Settings" title="Settings" />
      <Section title="Appearance" description="Saved on this device.">
        <div className="max-w-xl">
          <ThemePicker />
        </div>
      </Section>
      <Section title="Interests & personalization" description="These shape the “For you” feed. Your actions refine it over time.">
        <PreferencesForm initial={prefs} mode="settings" />
      </Section>
      <Section title="Reset personalization" description="Clears interaction history, hidden ideas and stated interests. Your vault, projects and gym log are kept.">
        <ResetPersonalization />
      </Section>
      <Section title="AI" description="Each feature is routed to a model tier by task complexity.">
        <div className="mb-4 flex items-center gap-2">
          <Badge tone={ai ? "success" : "warn"}>{ai ? "Connected" : "Not configured"}</Badge>
          {!ai ? <span className="text-[13px] text-ink-3">Set ANTHROPIC_API_KEY on the server to enable AI features.</span> : null}
        </div>
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[520px] text-left text-[13.5px]">
            <thead className="bg-bg-elev text-[12px] text-ink-3">
              <tr>
                <th className="px-4 py-2.5 font-normal">Tier</th>
                <th className="px-4 py-2.5 font-normal">Model</th>
                <th className="px-4 py-2.5 font-normal">Used for</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["heavy", "Hackathon ranking, build plans"],
                  ["standard", "Idea generation, similar ideas, remixing"],
                  ["light", "Thinking Gym feedback, explaining external projects"],
                ] as const
              ).map(([t, use]) => (
                <tr key={t} className="border-t border-line">
                  <td className="px-4 py-2.5 capitalize text-ink">{t}</td>
                  <td className="px-4 py-2.5 font-mono text-[12.5px] text-ink-2">{modelFor(t)}</td>
                  <td className="px-4 py-2.5 text-ink-2">{use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mb-2 mt-6 text-[13px] font-medium text-ink">Your usage, last 30 days</p>
        {usage.length ? (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[520px] text-left text-[13px]">
              <thead className="bg-bg-elev text-[12px] text-ink-3">
                <tr>
                  <th className="px-4 py-2 font-normal">Feature</th>
                  <th className="px-4 py-2 font-normal">Model</th>
                  <th className="px-4 py-2 text-right font-normal">Calls</th>
                  <th className="px-4 py-2 text-right font-normal">Tokens in / out</th>
                  <th className="px-4 py-2 text-right font-normal">Est. cost</th>
                </tr>
              </thead>
              <tbody>
                {usage.map((u) => (
                  <tr key={u.engine + u.model} className="border-t border-line">
                    <td className="px-4 py-2 text-ink">{u.engine}</td>
                    <td className="px-4 py-2 font-mono text-[12px] text-ink-2">{u.model}</td>
                    <td className="px-4 py-2 text-right font-mono text-ink-2">
                      {u.calls}
                      {u.failures ? <span className="text-danger"> ({u.failures} failed)</span> : null}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-ink-2">
                      {(u.input ?? 0).toLocaleString()} / {(u.output ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-ink-2">${(u.cost ?? 0).toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-line px-4 py-2 text-right font-mono text-[12px] text-ink-3">Total ≈ ${totalCost.toFixed(3)}</p>
          </div>
        ) : (
          <p className="text-[13px] text-ink-3">No AI requests yet.</p>
        )}
      </Section>
      <Section title="Global sources" description="Public APIs used for the Global Ideas feed. Each source refreshes at most every few hours.">
        <div className="grid gap-3 sm:grid-cols-2">
          {sources.map((s) => (
            <Card key={s.id} className="p-4">
              <p className="font-medium text-ink">{s.name}</p>
              <p className="mt-1 text-[13px] text-ink-2">{s.count} projects stored</p>
              <p className="mt-1 text-[12px] text-ink-3">
                {s.last ? `Last run ${new Date(s.last.ranAt).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })} · +${s.last.added}` : "Never run"}
                {s.last?.error ? <span className="block text-danger">Last error: {s.last.error}</span> : null}
              </p>
            </Card>
          ))}
        </div>
      </Section>
      <Section title="Account">
        <p className="text-[14px] text-ink">{user.name}</p>
        <p className="text-[13px] text-ink-3">{user.email}</p>
      </Section>
    </div>
  );
}
