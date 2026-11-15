"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Compass,
  Dumbbell,
  FlaskConical,
  Hammer,
  Home,
  Library,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Shuffle,
  Sun,
  Trophy,
  User,
  X,
} from "lucide-react";
import { buttonClass, cx, Kbd } from "./ui";
import { useApp } from "./providers";
import { CommandSearch } from "./command-search";
import { RemixDock } from "./remix-dock";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/lab", label: "AI Lab", icon: FlaskConical },
  { href: "/remix", label: "Remix", icon: Shuffle },
  { href: "/hackathon", label: "Hackathon", icon: Trophy },
  { href: "/gym", label: "Thinking Gym", icon: Dumbbell },
  { href: "/vault", label: "Idea Vault", icon: Library },
  { href: "/build", label: "Build Mode", icon: Hammer },
];

const MOBILE_TABS = ["/", "/discover", "/lab", "/gym", "/vault"];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
        <rect x="1" y="1" width="30" height="30" rx="9" fill="var(--text)" />
        <circle cx="16" cy="13" r="5.2" fill="none" stroke="var(--bg)" strokeWidth="2.4" />
        <path d="M13.2 21.5h5.6M14 25h4" stroke="var(--bg)" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="16" cy="13" r="1.8" fill="var(--accent)" />
      </svg>
      {compact ? null : <span className="text-[15px] font-semibold tracking-tight text-ink">Idea Gym</span>}
    </span>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  useEffect(() => {
    const t = document.documentElement.dataset.theme as "light" | "dark" | undefined;
    // Hydration-safe: the effective theme is only known in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(t ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  }, []);
  const flip = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("ig.theme", next);
    } catch {
      /* ignore */
    }
    setTheme(next);
  };
  return (
    <button onClick={flip} className={buttonClass("ghost", "icon")} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

function UserMenu() {
  const { user } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  if (!user)
    return (
      <div className="flex items-center gap-1.5">
        <Link href="/login" className={buttonClass("ghost", "sm")}>
          Sign in
        </Link>
        <Link href="/signup" className={buttonClass("primary", "sm")}>
          Join free
        </Link>
      </div>
    );
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="grid h-9 w-9 place-items-center rounded-full bg-surface-3 text-[13px] font-semibold text-ink transition hover:ring-2 hover:ring-line-strong"
      >
        {user.name.slice(0, 1).toUpperCase()}
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div role="menu" className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-line bg-surface p-1.5 shadow-float animate-pop">
            <div className="px-3 py-2">
              <p className="truncate text-sm font-medium text-ink">{user.name}</p>
              <p className="truncate text-xs text-ink-3">{user.email}</p>
            </div>
            <div className="my-1 h-px bg-line" />
            {[
              { href: "/profile", label: "Creativity profile", icon: User },
              { href: "/settings", label: "Settings", icon: Settings },
            ].map((x) => (
              <Link key={x.href} role="menuitem" href={x.href} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink">
                <x.icon size={15} /> {x.label}
              </Link>
            ))}
            <button role="menuitem" onClick={logout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink">
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      } else if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement)?.isContentEditable)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);


  const bare = pathname === "/login" || pathname === "/signup";
  if (bare) return <>{children}</>;

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only z-[90] rounded-lg bg-ink px-3 py-2 text-bg focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-bg-elev px-3 py-4 lg:flex">
        <Link href="/" className="mb-6 px-2.5 py-1">
          <Logo />
        </Link>
        <nav aria-label="Primary" className="flex flex-col gap-0.5">
          {NAV.map((n) => {
            const active = isActive(pathname, n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "group flex h-9 items-center gap-3 rounded-lg px-2.5 text-[14px] transition-colors",
                  active ? "bg-surface-3/70 font-medium text-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                )}
              >
                <n.icon size={17} className={cx(active ? "text-accent" : "text-ink-3 group-hover:text-ink-2")} strokeWidth={active ? 2.2 : 1.8} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl border border-line bg-surface p-3.5">
          <p className="text-[13px] font-medium text-ink">Discover → Think → Build</p>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-3">Save what sparks you, train with a daily challenge, then turn one idea into a plan.</p>
        </div>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/80 backdrop-blur-md lg:pl-60">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-3 px-4 md:px-8">
          <Link href="/" className="lg:hidden" aria-label="Idea Gym home">
            <Logo />
          </Link>
          <button
            onClick={() => setSearchOpen(true)}
            className="ml-auto flex h-9 items-center gap-2.5 rounded-xl border border-line bg-surface px-3 text-sm text-ink-3 transition hover:border-line-strong lg:ml-0 lg:w-80"
            aria-label="Search ideas"
          >
            <Search size={15} />
            <span className="hidden lg:inline">Search ideas, problems, tech…</span>
            <span className="ml-auto hidden items-center gap-1 lg:flex">
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
          <div className="flex items-center gap-1 lg:ml-auto">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main id="main" className="lg:pl-60">
        <div className="mx-auto max-w-[1200px] px-4 pb-32 pt-6 md:px-8 md:pt-10 lg:pb-20">{children}</div>
      </main>

      {/* Mobile tab bar */}
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-6">
          {NAV.filter((n) => MOBILE_TABS.includes(n.href)).map((n) => {
            const active = isActive(pathname, n.href);
            return (
              <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={cx("flex flex-col items-center gap-1 py-2.5 text-[10.5px]", active ? "text-ink" : "text-ink-3")}>
                <n.icon size={20} strokeWidth={active ? 2.2 : 1.7} className={active ? "text-accent" : ""} />
                {n.label.replace("Thinking ", "").replace("Idea ", "")}
              </Link>
            );
          })}
          <button onClick={() => setMoreOpen(true)} className="flex flex-col items-center gap-1 py-2.5 text-[10.5px] text-ink-3" aria-haspopup="dialog">
            <Menu size={20} strokeWidth={1.7} />
            More
          </button>
        </div>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-[60] bg-black/40 animate-fade-in lg:hidden" onClick={() => setMoreOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="More navigation" className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-line bg-surface p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-float animate-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-sm font-semibold text-ink">More</p>
              <button onClick={() => setMoreOpen(false)} className={buttonClass("ghost", "icon")} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[...NAV.filter((n) => !MOBILE_TABS.includes(n.href)), { href: "/profile", label: "Profile", icon: User }, { href: "/settings", label: "Settings", icon: Settings }].map((n) => (
                <Link key={n.href} href={n.href} onClick={() => setMoreOpen(false)} className="flex items-center gap-3 rounded-xl border border-line bg-bg-elev px-3.5 py-3.5 text-sm text-ink">
                  <n.icon size={18} className="text-ink-2" />
                  {n.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <RemixDock />
      <CommandSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
