import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProject } from "@/lib/repo/workspace";
import { ProjectWorkspace } from "./workspace";

export const metadata: Metadata = { title: "Project" };

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/build/${id}`);
  const project = getProject(user.id, id);
  if (!project) notFound();
  return (
    <>
      <Link href="/build" className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-ink">
        <ArrowLeft size={14} /> Build Mode
      </Link>
      <ProjectWorkspace initial={project} />
    </>
  );
}
