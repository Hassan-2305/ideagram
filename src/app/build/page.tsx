import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Hammer } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listVault } from "@/lib/repo/vault";
import { listProjects } from "@/lib/repo/workspace";
import { categoryLabel } from "@/lib/types";
import { Badge, ButtonLink, cx, EmptyState, PageHeader, SectionHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Build Mode" };

export default async function BuildPage() {
  const user = await requireUser("/build");
  const projects = listProjects(user.id);
  const candidates = listVault(user.id)
    .filter((v) => ["interesting", "exploring", "planned"].includes(v.status) && !projects.some((p) => p.ideaId === v.idea.id))
    .slice(0, 6);

  return (
    <>
      <PageHeader
        eyebrow="Build Mode"
        title="From idea to shipped"
        description="Pick an idea and get product requirements, architecture, data model, API, milestones and a task list you can check off. Edit anything — it's your plan."
      />

      <section>
        <SectionHeader title="Your projects" />
        {projects.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => {
              const done = p.tasks.filter((t) => t.done).length;
              return (
                <Link key={p.id} href={`/build/${p.id}`} className="group flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card">
                  <div className="flex items-center justify-between">
                    <Badge tone={p.status === "completed" ? "success" : p.status === "building" ? "accent" : "neutral"}>{p.status}</Badge>
                    <span className="font-mono text-[12px] text-ink-3">
                      {done}/{p.tasks.length} tasks
                    </span>
                  </div>
                  <p className="mt-3 text-[17px] font-semibold leading-snug text-ink group-hover:text-accent-text">{p.title}</p>
                  <p className="mt-1.5 line-clamp-2 text-[13.5px] text-ink-2">{p.plan.pitch}</p>
                  <div className="mt-auto pt-5">
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                      <div className={cx("h-full rounded-full", p.status === "completed" ? "bg-success" : "bg-accent")} style={{ width: `${Math.max(2, p.progress * 100)}%` }} />
                    </div>
                    <p className="mt-2 text-[12px] text-ink-3">Updated {new Date(p.updatedAt).toLocaleDateString("en", { dateStyle: "medium" })}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={<Hammer size={20} />} title="No projects yet" description="Choose an idea below — or open any idea and press “Build this idea”." />
        )}
      </section>

      <section className="mt-14">
        <SectionHeader title="Ready to build from your vault" description="Ideas you saved that don't have a plan yet." />
        {candidates.length ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {candidates.map((v) => (
              <li key={v.idea.id}>
                <Link href={`/build/new?idea=${v.idea.id}`} className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition hover:border-line-strong">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-ink-3">
                      {categoryLabel(v.idea.category)} · {v.status}
                    </p>
                    <p className="mt-1 truncate font-semibold text-ink">{v.idea.title}</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-[13px] text-ink-2 group-hover:text-ink">
                    Plan it <ArrowRight size={14} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-wrap items-center gap-3 text-[14px] text-ink-2">
            Save ideas you&apos;d like to build first.
            <ButtonLink href="/discover" variant="secondary" size="sm">
              Discover
            </ButtonLink>
            <ButtonLink href="/lab" variant="secondary" size="sm">
              Generate in AI Lab
            </ButtonLink>
          </div>
        )}
      </section>
    </>
  );
}
