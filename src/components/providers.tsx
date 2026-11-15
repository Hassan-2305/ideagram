"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Info, X, AlertTriangle } from "lucide-react";
import type { SessionUser } from "@/lib/types";
import { buttonClass, cx } from "./ui";

// ---------------- toasts ----------------
type ToastTone = "success" | "error" | "info";
interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
  action?: { label: string; href?: string; onClick?: () => void };
}

// ---------------- remix tray ----------------
export interface TrayIdea {
  id: string;
  title: string;
  category: string;
}

interface AppCtx {
  user: SessionUser | null;
  aiEnabled: boolean;
  toast: (message: string, tone?: ToastTone, action?: Toast["action"]) => void;
  requireAuth: (reason: string) => boolean; // true if signed in; otherwise prompts
  tray: TrayIdea[];
  toggleTray: (idea: TrayIdea) => void;
  clearTray: () => void;
  inTray: (id: string) => boolean;
}

const Ctx = createContext<AppCtx | null>(null);

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside <AppProviders>");
  return v;
}

const TRAY_KEY = "ig.remix-tray.v1";

export function AppProviders({ user, aiEnabled, children }: { user: SessionUser | null; aiEnabled: boolean; children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [authPrompt, setAuthPrompt] = useState<string | null>(null);
  const [tray, setTray] = useState<TrayIdea[]>([]);
  const nextId = useRef(1);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TRAY_KEY);
      if (raw) setTray((JSON.parse(raw) as TrayIdea[]).slice(0, 4));
    } catch {
      /* storage unavailable: tray simply starts empty */
    }
  }, []);

  const persist = (next: TrayIdea[]) => {
    try {
      localStorage.setItem(TRAY_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const toast = useCallback<AppCtx["toast"]>((message, tone = "success", action) => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-2), { id, message, tone, action }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), action ? 6000 : 3600);
  }, []);

  const requireAuth = useCallback(
    (reason: string) => {
      if (user) return true;
      setAuthPrompt(reason);
      return false;
    },
    [user],
  );

  const toggleTray = useCallback(
    (idea: TrayIdea) => {
      setTray((cur) => {
        let next: TrayIdea[];
        if (cur.some((x) => x.id === idea.id)) next = cur.filter((x) => x.id !== idea.id);
        else if (cur.length >= 4) {
          toast("The remix tray holds up to 4 ideas.", "info");
          return cur;
        } else next = [...cur, idea];
        persist(next);
        return next;
      });
    },
    [toast],
  );

  const value = useMemo<AppCtx>(
    () => ({
      user,
      aiEnabled,
      toast,
      requireAuth,
      tray,
      toggleTray,
      clearTray: () => {
        setTray([]);
        persist([]);
      },
      inTray: (id) => tray.some((x) => x.id === id),
    }),
    [user, aiEnabled, toast, requireAuth, tray, toggleTray],
  );

  return (
    <Ctx value={value}>
      {children}
      {/* Toasts */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 md:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink shadow-float animate-sheet"
          >
            <span
              className={cx(
                "grid h-5 w-5 shrink-0 place-items-center rounded-full",
                t.tone === "success" && "bg-success-soft text-success",
                t.tone === "error" && "bg-danger-soft text-danger",
                t.tone === "info" && "bg-surface-2 text-ink-2",
              )}
            >
              {t.tone === "success" ? <Check size={12} /> : t.tone === "error" ? <AlertTriangle size={12} /> : <Info size={12} />}
            </span>
            <span className="min-w-0 flex-1">{t.message}</span>
            {t.action ? (
              t.action.href ? (
                <Link href={t.action.href} className="font-medium text-accent-text hover:underline">
                  {t.action.label}
                </Link>
              ) : (
                <button onClick={t.action.onClick} className="font-medium text-accent-text hover:underline">
                  {t.action.label}
                </button>
              )
            ) : null}
          </div>
        ))}
      </div>
      {/* Sign-in prompt */}
      {authPrompt ? (
        <div className="fixed inset-0 z-[80] grid place-items-end bg-black/40 p-4 animate-fade-in sm:place-items-center" onClick={() => setAuthPrompt(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-prompt-title"
            className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-float animate-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2 id="auth-prompt-title" className="font-serif text-2xl text-ink">
                Keep your thinking
              </h2>
              <button onClick={() => setAuthPrompt(null)} aria-label="Close" className={buttonClass("ghost", "icon")}>
                <X size={16} />
              </button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">Create a free account to {authPrompt}. Your vault, remixes and plans are private to you.</p>
            <div className="mt-5 flex gap-2">
              <Link href={`/signup?next=${encodeURIComponent(pathname)}`} className={buttonClass("primary", "md", "flex-1")}>
                Create account
              </Link>
              <Link href={`/login?next=${encodeURIComponent(pathname)}`} className={buttonClass("secondary", "md", "flex-1")}>
                Sign in
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </Ctx>
  );
}
