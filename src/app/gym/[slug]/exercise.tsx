"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Flame, Lightbulb, Lock, Sparkles, Library } from "lucide-react";
import { api, errorMessage } from "@/lib/client";
import type { ChallengeFeedback } from "@/lib/ai/schemas";
import { useApp } from "@/components/providers";
import { Badge, Button, buttonClass, Textarea } from "@/components/ui";

interface Props {
  challenge: { slug: string; kind: string; title: string; hints: string[]; questions: string[]; category: string };
  signedIn: boolean;
  past: { id: string; response: string; createdAt: string; feedback: ChallengeFeedback | null }[];
}

function Feedback({ fb }: { fb: ChallengeFeedback }) {
  return (
    <div className="mt-4 grid gap-4 rounded-2xl border border-line bg-bg-elev p-5 animate-fade-up md:grid-cols-2">
      <div className="flex items-center gap-2 md:col-span-2">
        <Sparkles size={15} className="text-accent" />
        <p className="text-[14px] font-semibold text-ink">Coach feedback</p>
        <Badge tone={fb.originality === "surprising" ? "success" : fb.originality === "fresh" ? "accent" : "neutral"}>{fb.originality}</Badge>
      </div>
      <div>
        <p className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.13em] text-success">Strengths</p>
        <ul className="space-y-1.5 text-[14px] leading-relaxed text-ink-2">
          {fb.strengths.map((s, i) => (
            <li key={i}>— {s}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.13em] text-warn">Blind spots</p>
        <ul className="space-y-1.5 text-[14px] leading-relaxed text-ink-2">
          {fb.blindSpots.map((s, i) => (
            <li key={i}>— {s}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl bg-surface p-4 md:col-span-2">
        <p className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.13em] text-accent-text">Push further</p>
        <p className="font-serif text-lg italic leading-snug text-ink">{fb.pushFurther}</p>
      </div>
      {fb.thinkingPatterns.length ? (
        <div className="flex flex-wrap gap-1.5 md:col-span-2">
          {fb.thinkingPatterns.map((p) => (
            <span key={p} className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[12px] text-ink-2">
              {p}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Exercise({ challenge, signedIn, past }: Props) {
  const router = useRouter();
  const { toast, aiEnabled, requireAuth } = useApp();
  const [hints, setHints] = useState(0);
  const [response, setResponse] = useState(
    challenge.kind === "reverse-engineer" && challenge.questions.length ? challenge.questions.map((q) => `${q}\n`).join("\n") : "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ submissionId: string; perspectives: { title: string; body: string }[]; streak: number } | null>(null);
  const [feedback, setFeedback] = useState<ChallengeFeedback | null>(null);
  const [fbBusy, setFbBusy] = useState(false);
  const [fbError, setFbError] = useState<string | null>(null);
  const [captured, setCaptured] = useState(false);

  const words = response.trim().split(/\s+/).filter(Boolean).length;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!requireAuth("submit answers and keep a thinking streak")) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ submission: { id: string }; perspectives: { title: string; body: string }[]; stats: { current: number } }>("/api/gym/submit", {
        body: { challengeSlug: challenge.slug, response },
      });
      setResult({ submissionId: r.submission.id, perspectives: r.perspectives, streak: r.stats.current });
      toast(r.stats.current > 1 ? `Logged — ${r.stats.current}-day streak` : "Logged to your thinking log", "success");
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function getFeedback(id: string) {
    setFbBusy(true);
    setFbError(null);
    try {
      const r = await api<{ feedback: ChallengeFeedback }>("/api/gym/feedback", { body: { submissionId: id } });
      setFeedback(r.feedback);
    } catch (e) {
      setFbError(errorMessage(e));
    } finally {
      setFbBusy(false);
    }
  }

  async function capture() {
    try {
      const firstLine = response.trim().split("\n")[0].slice(0, 100);
      await api("/api/ideas", {
        body: {
          title: firstLine.length >= 3 ? firstLine : challenge.title,
          summary: response.trim().slice(0, 400),
          problem: "",
          solution: response.trim().slice(0, 2000),
          category: challenge.category,
          difficulty: "intermediate",
          stack: [],
        },
      });
      setCaptured(true);
      toast("Saved your idea to the vault", "success", { label: "Open vault", href: "/vault" });
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  }

  return (
    <div className="mt-6">
      {challenge.hints.length ? (
        <div className="mb-6">
          {challenge.hints.slice(0, hints).map((h, i) => (
            <p key={i} className="mb-2 flex gap-2.5 rounded-xl bg-warn-soft px-4 py-2.5 text-[14px] text-warn animate-fade-in">
              <Lightbulb size={16} className="mt-0.5 shrink-0" /> {h}
            </p>
          ))}
          {hints < challenge.hints.length && !result ? (
            <button onClick={() => setHints((n) => n + 1)} className="inline-flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-ink">
              <Lightbulb size={14} /> {hints === 0 ? "Stuck? Show a hint" : "Another hint"} ({challenge.hints.length - hints} left)
            </button>
          ) : null}
        </div>
      ) : null}

      {!result ? (
        <form onSubmit={submit}>
          <label htmlFor="response" className="mb-2 block text-[14px] font-medium text-ink">
            Your thinking
          </label>
          <Textarea
            id="response"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            maxLength={6000}
            className="min-h-56 text-[16px]"
            placeholder="Write it rough. What's the real problem? Who has it? What would you try first — and why might it fail?"
          />
          <div className="mt-2 flex items-center justify-between text-[12px] text-ink-3">
            <span>{words} words</span>
            <span className="inline-flex items-center gap-1">
              <Lock size={12} /> Other perspectives unlock after you submit
            </span>
          </div>
          {error ? (
            <p role="alert" className="mt-3 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </p>
          ) : null}
          <Button type="submit" size="lg" className="mt-4" loading={busy} disabled={response.trim().length < 20}>
            <Eye size={16} /> {signedIn ? "Submit & reveal perspectives" : "Sign in to submit"}
          </Button>
        </form>
      ) : (
        <div className="animate-fade-up">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-[0.13em] text-ink-3">Your answer</p>
              {result.streak ? (
                <span className="inline-flex items-center gap-1 text-[12.5px] text-accent-text">
                  <Flame size={13} /> {result.streak}-day streak
                </span>
              ) : null}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{response}</p>
          </div>

          <div className="mt-4">
            {feedback ? (
              <Feedback fb={feedback} />
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="secondary" onClick={() => getFeedback(result.submissionId)} loading={fbBusy} disabled={!aiEnabled}>
                  <Sparkles size={15} /> Get coach feedback
                </Button>
                {!captured ? (
                  <Button variant="ghost" onClick={capture}>
                    <Library size={15} /> Save my idea to the vault
                  </Button>
                ) : (
                  <span className="text-[13px] text-success">Saved to your vault</span>
                )}
                {!aiEnabled ? <span className="text-[12.5px] text-ink-3">Feedback unavailable — no AI key on this server.</span> : null}
              </div>
            )}
            {fbError ? <p className="mt-2 text-sm text-danger">{fbError}</p> : null}
          </div>

          <h2 className="mb-4 mt-10 text-[17px] font-semibold text-ink">Other ways to see it</h2>
          <div className="grid gap-3">
            {result.perspectives.map((p, i) => (
              <div key={i} className="rounded-2xl border border-line bg-surface p-5 animate-fade-up" style={{ animationDelay: `${i * 90}ms` }}>
                <p className="font-mono text-[11px] text-accent-text">Perspective {i + 1}</p>
                <p className="mt-1.5 text-[16px] font-semibold text-ink">{p.title}</p>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">{p.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-[13px] leading-relaxed text-ink-3">These aren&apos;t “right answers” — they&apos;re other angles. Notice which ones you didn&apos;t consider; that&apos;s the muscle you&apos;re training.</p>
          <div className="mt-6 flex gap-2">
            <Link href="/gym" className={buttonClass("secondary")}>
              Back to the gym
            </Link>
          </div>
        </div>
      )}

      {past.length ? (
        <section className="mt-12">
          <h2 className="mb-3 text-[15px] font-semibold text-ink">Your previous attempts</h2>
          <ul className="space-y-3">
            {past.map((p) => (
              <li key={p.id} className="rounded-2xl border border-line bg-surface p-4">
                <p className="font-mono text-[11px] text-ink-3">{new Date(p.createdAt).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}</p>
                <p className="mt-1.5 line-clamp-4 whitespace-pre-wrap text-[14px] text-ink-2">{p.response}</p>
                {p.feedback ? <Feedback fb={p.feedback} /> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
