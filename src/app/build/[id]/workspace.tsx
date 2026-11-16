"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, Pencil, Plus, Trash2, X } from "lucide-react";
import { api, errorMessage } from "@/lib/client";
import type { ProjectPlan } from "@/lib/ai/schemas";
import type { Idea } from "@/lib/types";
import { useApp } from "@/components/providers";
import { Badge, Button, cx, Input, Select, Textarea } from "@/components/ui";

interface Task {
  id: string;
  milestone: string;
  title: string;
  done: boolean;
  position: number;
}
interface Project {
  id: string;
  ideaId: string | null;
  idea: Idea | null;
  title: string;
  status: "planned" | "building" | "paused" | "completed";
  plan: ProjectPlan;
  tasks: Task[];
  progress: number;
}

const TABS = ["Tasks", "Product", "Technical", "Ship"] as const;

function H({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-[12px] font-semibold text-ink-3">{children}</h3>;
}

function toMarkdown(p: Project): string {
  const pl = p.plan;
  const L: string[] = [`# ${p.title}`, "", pl.pitch, "", `Status: ${p.status} · Progress: ${Math.round(p.progress * 100)}%`, ""];
  L.push("## Requirements", ...pl.requirements.map((r) => `- **${r.id}** (${r.priority}) ${r.text}`), "");
  L.push("## MVP features", ...pl.mvpFeatures.map((f) => `- ${f}`), "");
  L.push("## Architecture", pl.architecture, "");
  L.push("## Data model", ...pl.dataModel.flatMap((e) => [`### ${e.entity}`, ...e.fields.map((f) => `- ${f}`), e.notes ? `_${e.notes}_` : "", ""]));
  L.push("## API", ...pl.api.map((a) => `- \`${a.method} ${a.path}\` — ${a.purpose}`), "");
  L.push("## Stack", ...pl.stack.map((s) => `- **${s.layer}:** ${s.choice} — ${s.why}`), "");
  const ms = [...new Set(p.tasks.map((t) => t.milestone))];
  L.push("## Milestones & tasks");
  for (const m of ms) {
    const meta = pl.milestones.find((x) => x.name === m);
    L.push(`### ${m}${meta ? ` (${meta.duration})` : ""}`, meta?.goal ?? "", ...p.tasks.filter((t) => t.milestone === m).map((t) => `- [${t.done ? "x" : " "}] ${t.title}`), "");
  }
  L.push("## Testing", ...pl.testing.map((t) => `- ${t}`), "", "## Deployment", ...pl.deployment.map((t) => `- ${t}`), "");
  L.push("## Risks", ...pl.risks.map((r) => `- **${r.risk}** — ${r.mitigation}`), "");
  return L.join("\n");
}

const lines = (s: string) =>
  s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

export function ProjectWorkspace({ initial }: { initial: Project }) {
  const router = useRouter();
  const { toast } = useApp();
  const [p, setP] = useState(initial);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Tasks");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: p.title, pitch: p.plan.pitch, architecture: p.plan.architecture, mvp: p.plan.mvpFeatures.join("\n"), testing: p.plan.testing.join("\n"), deployment: p.plan.deployment.join("\n") });
  const [newTask, setNewTask] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const done = p.tasks.filter((t) => t.done).length;
  const progress = p.tasks.length ? done / p.tasks.length : 0;
  const milestones = [...new Set([...p.plan.milestones.map((m) => m.name), ...p.tasks.map((t) => t.milestone)])];

  const setStatus = async (status: Project["status"]) => {
    const prev = p.status;
    setP((x) => ({ ...x, status }));
    try {
      await api(`/api/projects/${p.id}`, { method: "PATCH", body: { status } });
      if (status === "completed") toast("Shipped. That's the whole point — well done.", "success");
    } catch (e) {
      setP((x) => ({ ...x, status: prev }));
      toast(errorMessage(e), "error");
    }
  };

  const toggleTask = async (t: Task) => {
    setP((x) => ({ ...x, tasks: x.tasks.map((y) => (y.id === t.id ? { ...y, done: !t.done } : y)) }));
    try {
      const r = await api<{ status?: Project["status"] }>(`/api/projects/${p.id}/tasks/${t.id}`, { method: "PATCH", body: { done: !t.done } });
      if (r.status) setP((x) => ({ ...x, status: r.status! }));
    } catch (e) {
      setP((x) => ({ ...x, tasks: x.tasks.map((y) => (y.id === t.id ? { ...y, done: t.done } : y)) }));
      toast(errorMessage(e), "error");
    }
  };

  const addTask = async (milestone: string) => {
    const title = (newTask[milestone] ?? "").trim();
    if (!title) return;
    try {
      const r = await api<{ task: Task }>(`/api/projects/${p.id}/tasks`, { body: { milestone, title } });
      setP((x) => ({ ...x, tasks: [...x.tasks, r.task] }));
      setNewTask((s) => ({ ...s, [milestone]: "" }));
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };

  const deleteTask = async (t: Task) => {
    setP((x) => ({ ...x, tasks: x.tasks.filter((y) => y.id !== t.id) }));
    try {
      await api(`/api/projects/${p.id}/tasks/${t.id}`, { method: "DELETE" });
    } catch (e) {
      setP((x) => ({ ...x, tasks: [...x.tasks, t].sort((a, b) => a.position - b.position) }));
      toast(errorMessage(e), "error");
    }
  };

  const saveEdits = async () => {
    setSaving(true);
    const plan: ProjectPlan = { ...p.plan, title: draft.title.trim() || p.title, pitch: draft.pitch.trim(), architecture: draft.architecture.trim(), mvpFeatures: lines(draft.mvp), testing: lines(draft.testing), deployment: lines(draft.deployment) };
    try {
      await api(`/api/projects/${p.id}`, { method: "PATCH", body: { title: plan.title, plan } });
      setP((x) => ({ ...x, title: plan.title, plan }));
      setEditing(false);
      toast("Plan updated", "success");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this project and its tasks? The idea stays in your vault.")) return;
    try {
      await api(`/api/projects/${p.id}`, { method: "DELETE" });
      router.push("/build");
      router.refresh();
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };

  const download = () => {
    const blob = new Blob([toMarkdown({ ...p, progress })], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${p.title.replace(/[^\w-]+/g, "-").toLowerCase()}-plan.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      <header className="animate-fade-up">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {editing ? (
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength={120} className="h-14 font-serif text-3xl" aria-label="Project title" />
            ) : (
              <h1 className="font-serif text-[2.4rem] leading-[1.05] text-ink md:text-[3rem]">{p.title}</h1>
            )}
            {p.idea ? (
              <Link href={`/idea/${p.idea.id}`} className="mt-2 inline-block text-[13px] text-ink-3 hover:text-ink">
                From idea: {p.idea.title}
              </Link>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select aria-label="Project status" value={p.status} onChange={(e) => setStatus(e.target.value as Project["status"])} className="h-10 w-auto capitalize">
              {["planned", "building", "paused", "completed"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            {editing ? (
              <>
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={saveEdits} loading={saving}>
                  <Check size={15} /> Save plan
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => (setEditing(true), setTab(tab === "Tasks" ? "Product" : tab))}>
                  <Pencil size={15} /> Edit plan
                </Button>
                <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl" onClick={download} aria-label="Download plan as Markdown" title="Download as Markdown">
                  <Download size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={remove} aria-label="Delete project">
                  <Trash2 size={16} />
                </Button>
              </>
            )}
          </div>
        </div>
        {editing ? (
          <Textarea value={draft.pitch} onChange={(e) => setDraft({ ...draft, pitch: e.target.value })} className="mt-4" aria-label="Pitch" />
        ) : (
          <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-ink-2">{p.plan.pitch}</p>
        )}
        <div className="mt-6 flex items-center gap-4">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Task progress">
            <div className={cx("h-full rounded-full transition-all duration-500", p.status === "completed" ? "bg-success" : "bg-accent")} style={{ width: `${progress * 100}%` }} />
          </div>
          <span className="font-mono text-[13px] text-ink-2">
            {done}/{p.tasks.length} · {Math.round(progress * 100)}%
          </span>
        </div>
      </header>

      <div role="tablist" aria-label="Plan sections" className="no-scrollbar mt-8 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cx("relative h-10 shrink-0 px-4 text-[14px] transition-colors", tab === t ? "font-medium text-ink" : "text-ink-3 hover:text-ink")}>
            {t === "Tasks" ? "Milestones & tasks" : t === "Product" ? "Product" : t === "Technical" ? "Architecture & data" : "Testing, deploy & risks"}
            {tab === t ? <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent" /> : null}
          </button>
        ))}
      </div>

      <div className="mt-8" role="tabpanel">
        {tab === "Tasks" ? (
          <div className="space-y-8">
            {milestones.map((m, mi) => {
              const meta = p.plan.milestones.find((x) => x.name === m);
              const tasks = p.tasks.filter((t) => t.milestone === m);
              const mDone = tasks.filter((t) => t.done).length;
              return (
                <section key={m} className="rounded-2xl border border-line bg-surface">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5">
                    <div>
                      <p className="font-mono text-[11px] text-ink-3">
                        Milestone {mi + 1}
                        {meta?.duration ? ` · ${meta.duration}` : ""}
                      </p>
                      <h3 className="mt-1 text-[17px] font-semibold text-ink">{m}</h3>
                      {meta?.goal ? <p className="mt-1 text-[13.5px] text-ink-2">{meta.goal}</p> : null}
                    </div>
                    <Badge tone={tasks.length && mDone === tasks.length ? "success" : "neutral"}>
                      {mDone}/{tasks.length}
                    </Badge>
                  </div>
                  <ul className="divide-y divide-line">
                    {tasks.map((t) => (
                      <li key={t.id} className="group flex items-center gap-3 px-5 py-3">
                        <button
                          onClick={() => toggleTask(t)}
                          role="checkbox"
                          aria-checked={t.done}
                          aria-label={t.title}
                          className={cx("grid h-5 w-5 shrink-0 place-items-center rounded-md border transition", t.done ? "border-success bg-success text-white animate-pop" : "border-line-strong hover:border-ink")}
                        >
                          {t.done ? <Check size={13} strokeWidth={3} /> : null}
                        </button>
                        <span className={cx("flex-1 text-[14.5px]", t.done ? "text-ink-3 line-through" : "text-ink")}>{t.title}</span>
                        <button onClick={() => deleteTask(t)} aria-label={`Delete task ${t.title}`} className="rounded p-1 text-ink-3 opacity-0 hover:text-danger focus:opacity-100 group-hover:opacity-100">
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <form
                    className="flex gap-2 border-t border-line p-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      addTask(m);
                    }}
                  >
                    <Input value={newTask[m] ?? ""} onChange={(e) => setNewTask((s) => ({ ...s, [m]: e.target.value }))} maxLength={300} placeholder="Add a task" className="h-9 text-sm" aria-label={`Add task to ${m}`} />
                    <Button type="submit" size="sm" variant="secondary" className="h-9" aria-label="Add task">
                      <Plus size={14} />
                    </Button>
                  </form>
                </section>
              );
            })}
          </div>
        ) : tab === "Product" ? (
          <div className="grid gap-10 lg:grid-cols-2">
            <section>
              <H>Product requirements</H>
              <ul className="space-y-2">
                {p.plan.requirements.map((r) => (
                  <li key={r.id} className="flex gap-3 rounded-xl border border-line bg-surface p-3.5 text-[14px]">
                    <span className="font-mono text-[12px] text-ink-3">{r.id}</span>
                    <span className="flex-1 text-ink-2">{r.text}</span>
                    <Badge tone={r.priority === "must" ? "accent" : "neutral"}>{r.priority}</Badge>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <H>MVP feature list</H>
              {editing ? (
                <Textarea value={draft.mvp} onChange={(e) => setDraft({ ...draft, mvp: e.target.value })} className="min-h-48 text-[14px]" aria-label="MVP features, one per line" />
              ) : (
                <ol className="space-y-2">
                  {p.plan.mvpFeatures.map((f, i) => (
                    <li key={i} className="flex gap-3 text-[14.5px] text-ink-2">
                      <span className="font-mono text-[12px] text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                      {f}
                    </li>
                  ))}
                </ol>
              )}
              {editing ? <p className="mt-1 text-[12px] text-ink-3">One feature per line.</p> : null}
            </section>
          </div>
        ) : tab === "Technical" ? (
          <div className="space-y-10">
            <section>
              <H>Architecture</H>
              {editing ? (
                <Textarea value={draft.architecture} onChange={(e) => setDraft({ ...draft, architecture: e.target.value })} className="min-h-40 text-[14.5px]" aria-label="Architecture" />
              ) : (
                <p className="max-w-3xl whitespace-pre-wrap text-[15px] leading-relaxed text-ink-2">{p.plan.architecture}</p>
              )}
            </section>
            <section>
              <H>Technology stack</H>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {p.plan.stack.map((s, i) => (
                  <div key={i} className="rounded-xl border border-line bg-surface p-4">
                    <p className="text-[12px] font-semibold text-ink-3">{s.layer}</p>
                    <p className="mt-1 font-semibold text-ink">{s.choice}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{s.why}</p>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <H>Database schema</H>
              <div className="grid gap-3 md:grid-cols-2">
                {p.plan.dataModel.map((e, i) => (
                  <div key={i} className="overflow-hidden rounded-xl border border-line bg-surface">
                    <p className="border-b border-line bg-bg-elev px-4 py-2.5 font-mono text-[13px] font-medium text-ink">{e.entity}</p>
                    <ul className="px-4 py-3 font-mono text-[12.5px] leading-6 text-ink-2">
                      {e.fields.map((f, j) => (
                        <li key={j}>{f}</li>
                      ))}
                    </ul>
                    {e.notes ? <p className="border-t border-line px-4 py-2.5 text-[12.5px] text-ink-3">{e.notes}</p> : null}
                  </div>
                ))}
              </div>
            </section>
            <section>
              <H>API design</H>
              <div className="overflow-x-auto rounded-xl border border-line bg-surface">
                <table className="w-full min-w-[520px] text-left text-[13.5px]">
                  <tbody>
                    {p.plan.api.map((a, i) => (
                      <tr key={i} className="border-b border-line last:border-0">
                        <td className="w-20 px-4 py-2.5 font-mono text-[12px] font-semibold text-accent-text">{a.method}</td>
                        <td className="px-4 py-2.5 font-mono text-[12.5px] text-ink">{a.path}</td>
                        <td className="px-4 py-2.5 text-ink-2">{a.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-2">
            <section>
              <H>Testing strategy</H>
              {editing ? (
                <Textarea value={draft.testing} onChange={(e) => setDraft({ ...draft, testing: e.target.value })} className="min-h-40 text-[14px]" aria-label="Testing, one per line" />
              ) : (
                <ul className="space-y-2 text-[14.5px] text-ink-2">
                  {p.plan.testing.map((t, i) => (
                    <li key={i}>— {t}</li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <H>Deployment plan</H>
              {editing ? (
                <Textarea value={draft.deployment} onChange={(e) => setDraft({ ...draft, deployment: e.target.value })} className="min-h-40 text-[14px]" aria-label="Deployment, one per line" />
              ) : (
                <ol className="space-y-2 text-[14.5px] text-ink-2">
                  {p.plan.deployment.map((t, i) => (
                    <li key={i}>
                      {i + 1}. {t}
                    </li>
                  ))}
                </ol>
              )}
            </section>
            <section className="lg:col-span-2">
              <H>Risks & mitigations</H>
              <div className="grid gap-3 md:grid-cols-2">
                {p.plan.risks.map((r, i) => (
                  <div key={i} className="rounded-xl border border-line bg-surface p-4">
                    <p className="font-medium text-ink">{r.risk}</p>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">{r.mitigation}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
