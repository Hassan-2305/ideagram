import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getHackathonSession } from "@/lib/repo/workspace";
import { HackathonResults } from "./results";

export const metadata: Metadata = { title: "Hackathon ideas" };

export default async function HackathonSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/hackathon/${id}`);
  const session = getHackathonSession(user.id, id);
  if (!session) notFound();
  const inp = session.inputs as { theme?: string; hours?: number; teamSize?: number; skills?: string };
  return (
    <>
      <Link href="/hackathon" className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-ink">
        <ArrowLeft size={14} /> Hackathon Mode
      </Link>
      <header className="mb-8 animate-fade-up">
        <p className="text-[12px] font-semibold text-ink-3">
          {inp.hours} hours · team of {inp.teamSize}
          {inp.skills ? ` · ${inp.skills}` : ""}
        </p>
        <h1 className="mt-3 font-serif text-[2.4rem] leading-[1.05] text-ink md:text-[3rem]">{inp.theme}</h1>
        <p className="mt-3 max-w-2xl text-[15px] text-ink-2">Star the ones worth considering, compare them side by side, then generate a full implementation plan for the one you pick.</p>
      </header>
      <HackathonResults sessionId={session.id} ideas={session.results} initialShortlist={session.shortlist} />
    </>
  );
}
