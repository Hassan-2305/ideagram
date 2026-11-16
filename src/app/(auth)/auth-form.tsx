"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, errorMessage } from "@/lib/client";
import { safeNextPath } from "@/lib/safe-next";
import { Logo } from "@/components/shell";
import { Button, Input, Label } from "@/components/ui";

function safeNext(raw: string | null) {
  return typeof window === "undefined" ? "/" : safeNextPath(raw, window.location.origin);
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const sp = useSearchParams();
  const next = safeNext(sp.get("next"));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api(`/api/auth/${mode}`, {
        body: { email: form.get("email"), password: form.get("password"), ...(mode === "signup" ? { name: form.get("name") } : {}) },
      });
      router.push(mode === "signup" ? "/welcome" : next);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden border-r border-line bg-bg-elev p-12 lg:flex lg:flex-col">
        <Link href="/">
          <Logo />
        </Link>
        <div className="my-auto max-w-md">
          <p className="text-[12px] font-semibold text-accent-text">Discover → Think → Remix → Build</p>
          <h1 className="mt-5 font-serif text-[3.4rem] leading-[1.02] text-ink">Swap the scroll for a sharper mind.</h1>
          <p className="mt-5 text-[16px] leading-relaxed text-ink-2">
            Real problems worth solving, projects from builders around the world, daily thinking exercises, and AI that turns a spark into a plan you can start tonight.
          </p>
        </div>
        <p className="text-[12px] text-ink-3">Private by default. Your vault, remixes and plans are visible only to you.</p>
      </div>
      <div className="flex flex-col justify-center px-5 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm animate-fade-up">
          <Link href="/" className="mb-10 inline-block lg:hidden">
            <Logo />
          </Link>
          <h2 className="font-serif text-4xl text-ink">{mode === "login" ? "Welcome back" : "Create your gym"}</h2>
          <p className="mt-2 text-sm text-ink-2">{mode === "login" ? "Sign in to your vault, projects and streak." : "Free, takes ten seconds. No email verification needed."}</p>
          <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate={false}>
            {mode === "signup" ? (
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" autoComplete="name" required maxLength={60} placeholder="Ada" />
              </div>
            ) : null}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={mode === "signup" ? 8 : 1}
                placeholder={mode === "signup" ? "At least 8 characters" : ""}
              />
            </div>
            {error ? (
              <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}
            <Button type="submit" size="lg" className="w-full" loading={busy}>
              {mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-ink-2">
            {mode === "login" ? (
              <>
                New here?{" "}
                <Link href={`/signup${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-ink underline-offset-4 hover:underline">
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have one?{" "}
                <Link href={`/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-ink underline-offset-4 hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
