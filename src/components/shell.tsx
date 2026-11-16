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
  Palette,
  PlusSquare,
  Search,
  Settings,
  Shuffle,
  Trophy,
  User,
  X,
} from "lucide-react";
import { buttonClass, cx } from "./ui";
import { useApp } from "./providers";
import { CommandSearch } from "./command-search";
import { ThemePicker } from "./theme-picker";
import { RemixDock } from "./remix-dock";

type NavItem = { href: string; label: string; icon: typeof Home };

const NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discover", label: "Explore", icon: Compass },
  { href: "/lab", label: "Create", icon: PlusSquare },
  { href: "/remix", label: "Remix", icon: Shuffle },
  { href: "/hackathon", label: "Hackathon", icon: Trophy },
  { href: "/gym", label: "Thinking Gym", icon: Dumbbell },
  { href: "/vault", label: "Saved", icon: Library },
  { href: "/build", label: "Build", icon: Hammer },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="bg-brand grid h-9 w-9 shrink-0 place-items-center rounded-[12px] shadow-brand">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.2 1.1 2V17h5v-1.2c0-.8.4-1.5 1.1-2A6 6 0 0 0 12 3Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
          <path d="M10 20.5h4" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="9" r="1.6" fill="white" />
        </svg>
      </span>
      {compact ? null : <span className="text-brand text-[21px] font-extrabold tracking-[-0.03em]">ideagym</span>}
    </span>
  );
}

function Avatar({ name, size = 28, active }: { name: string; size?: number; active?: boolean }) {
  return (
    <span className={cx("grid shrink-0 place-items-center rounded-full p-[2px]", active ? "ring-brand" : "bg-transparent")} style={{ width: size + 4, height: size + 4 }}>
      <span className="bg-brand-warm grid place-items-center rounded-full text-[12px] font-bold" style={{ width: size, height: size }}>
        {name.slice(0, 1).toUpperCase()}
      </span>
    </span>
  );
}


function SideLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cx(
        "group flex h-12 items-center gap-4 rounded-2xl px-3 text-[15px] transition-all",
        active ? "glass font-bold text-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
      )}
    >
      <item.icon size={24} strokeWidth={active ? 2.4 : 1.8} className={cx("transition-transform group-hover:scale-110", active && "text-accent")} />
      <span className="hidden xl:inline">{item.label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useApp();
  const [themeOpen, setThemeOpen] = useState(false);
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

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setMoreOpen(false);
    router.push("/");
    router.refresh();
  };

  const bare = pathname === "/login" || pathname === "/signup";
  if (bare) return <>{children}</>;

  const profileActive = isActive(pathname, "/profile");

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only z-[90] rounded-full bg-ink px-4 py-2 text-bg focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>

      {/* Desktop / tablet side rail */}
      <aside className="glass-strong fixed inset-y-0 left-0 z-30 hidden w-[76px] flex-col border-y-0 border-l-0 px-3 py-6 md:flex xl:w-[244px]">
        <Link href="/" className="mb-8 px-2" aria-label="Idea Gym home">
          <span className="xl:hidden">
            <Logo compact />
          </span>
          <span className="hidden xl:inline">
            <Logo />
          </span>
        </Link>
        <nav aria-label="Primary" className="flex flex-col gap-1">
          <button onClick={() => setSearchOpen(true)} className="group flex h-12 items-center gap-4 rounded-2xl px-3 text-[15px] text-ink-2 transition-all hover:bg-surface-2 hover:text-ink">
            <Search size={24} strokeWidth={1.8} className="transition-transform group-hover:scale-110" />
            <span className="hidden xl:inline">Search</span>
          </button>
          {NAV.map((n) => (
            <SideLink key={n.href} item={n} active={isActive(pathname, n.href)} />
          ))}
          {user ? (
            <Link
              href="/profile"
              aria-current={profileActive ? "page" : undefined}
              className={cx("group flex h-12 items-center gap-4 rounded-2xl px-2.5 text-[15px] transition-all", profileActive ? "glass font-bold text-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink")}
            >
              <Avatar name={user.name} size={26} active={profileActive} />
              <span className="hidden xl:inline">Profile</span>
            </Link>
          ) : null}
        </nav>
        <div className="mt-auto flex flex-col gap-1">
          <div className="relative">
            <button onClick={() => setThemeOpen((o) => !o)} aria-expanded={themeOpen} aria-haspopup="dialog" className={cx("group flex h-12 w-full items-center gap-4 rounded-2xl px-3 text-[15px] hover:bg-surface-2 hover:text-ink", themeOpen ? "glass text-ink" : "text-ink-2")}>
              <Palette size={24} strokeWidth={1.8} className="transition-transform group-hover:scale-110" />
              <span className="hidden xl:inline">Theme</span>
            </button>
            {themeOpen ? (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setThemeOpen(false)} />
                <div role="dialog" aria-label="Theme" className="glass-strong absolute bottom-0 left-full z-50 ml-3 w-[360px] rounded-3xl p-5 shadow-float animate-pop">
                  <ThemePicker />
                </div>
              </>
            ) : null}
          </div>
          {user ? (
            <>
              <SideLink item={{ href: "/settings", label: "Settings", icon: Settings }} active={isActive(pathname, "/settings")} />
              <button onClick={logout} className="group flex h-12 items-center gap-4 rounded-2xl px-3 text-[15px] text-ink-2 hover:bg-surface-2 hover:text-ink">
                <LogOut size={24} strokeWidth={1.8} />
                <span className="hidden xl:inline">Sign out</span>
              </button>
            </>
          ) : (
            <div className="hidden flex-col gap-2 xl:flex">
              <Link href="/signup" className={buttonClass("primary", "md")}>
                Join free
              </Link>
              <Link href="/login" className={buttonClass("secondary", "md")}>
                Sign in
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="glass-strong sticky top-0 z-30 border-x-0 border-t-0 md:hidden">
        <div className="flex h-14 items-center gap-2 px-4">
          <Link href="/" aria-label="Idea Gym home">
            <Logo />
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => setSearchOpen(true)} className={buttonClass("ghost", "icon", "h-10 w-10")} aria-label="Search">
              <Search size={22} />
            </button>
            <button onClick={() => setThemeOpen(true)} className={buttonClass("ghost", "icon", "h-10 w-10")} aria-label="Theme">
              <Palette size={21} />
            </button>
            {!user ? (
              <Link href="/signup" className={buttonClass("primary", "sm")}>
                Join
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <main id="main" className="md:pl-[76px] xl:pl-[244px]">
        <div className="mx-auto max-w-[1080px] px-4 pb-32 pt-5 md:px-8 md:pb-16 md:pt-10">{children}</div>
      </main>

      {/* Mobile tab bar */}
      <nav aria-label="Primary" className="glass-strong fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center">
          {[
            { href: "/", label: "Home", icon: Home },
            { href: "/discover", label: "Explore", icon: Compass },
          ].map((n) => (
            <Link key={n.href} href={n.href} aria-label={n.label} aria-current={isActive(pathname, n.href) ? "page" : undefined} className="grid place-items-center py-2">
              <n.icon size={26} strokeWidth={isActive(pathname, n.href) ? 2.5 : 1.8} className={isActive(pathname, n.href) ? "text-ink" : "text-ink-3"} />
            </Link>
          ))}
          <Link href="/lab" aria-label="Create ideas" className="grid place-items-center">
            <span className="bg-brand grid h-11 w-11 place-items-center rounded-2xl shadow-brand">
              <FlaskConical size={22} />
            </span>
          </Link>
          <Link href="/gym" aria-label="Thinking Gym" aria-current={isActive(pathname, "/gym") ? "page" : undefined} className="grid place-items-center py-2">
            <Dumbbell size={26} strokeWidth={isActive(pathname, "/gym") ? 2.5 : 1.8} className={isActive(pathname, "/gym") ? "text-ink" : "text-ink-3"} />
          </Link>
          <button onClick={() => setMoreOpen(true)} aria-label="Profile and more" aria-haspopup="dialog" className="grid place-items-center py-2">
            {user ? <Avatar name={user.name} size={26} active={profileActive} /> : <Menu size={26} strokeWidth={1.8} className="text-ink-3" />}
          </button>
        </div>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm animate-fade-in md:hidden" onClick={() => setMoreOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="More"
            className="glass-strong absolute inset-x-0 bottom-0 rounded-t-[28px] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] animate-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-surface-3" />
            <div className="mb-3 flex items-center justify-between px-1">
              {user ? (
                <Link href="/profile" onClick={() => setMoreOpen(false)} className="flex items-center gap-3">
                  <Avatar name={user.name} size={40} active />
                  <span>
                    <span className="block text-[15px] font-bold text-ink">{user.name}</span>
                    <span className="block text-[12.5px] text-ink-3">View profile</span>
                  </span>
                </Link>
              ) : (
                <p className="text-[15px] font-bold text-ink">More</p>
              )}
              <button onClick={() => setMoreOpen(false)} className={buttonClass("ghost", "icon")} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[...NAV.filter((n) => !["/", "/discover", "/lab", "/gym"].includes(n.href)), ...(user ? [{ href: "/settings", label: "Settings", icon: Settings }] : []), ...(user ? [] : [{ href: "/login", label: "Sign in", icon: User }])].map((n) => (
                <Link key={n.href} href={n.href} onClick={() => setMoreOpen(false)} className="glass flex flex-col items-center gap-2 rounded-2xl px-2 py-4 text-[12.5px] font-medium text-ink">
                  <n.icon size={22} className="text-accent" />
                  {n.label}
                </Link>
              ))}
              {user ? (
                <button onClick={logout} className="glass flex flex-col items-center gap-2 rounded-2xl px-2 py-4 text-[12.5px] font-medium text-ink">
                  <LogOut size={22} className="text-ink-3" />
                  Sign out
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {themeOpen ? (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm animate-fade-in md:hidden" onClick={() => setThemeOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Theme" className="glass-strong absolute inset-x-0 bottom-0 rounded-t-[28px] p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] animate-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-surface-3" />
            <ThemePicker />
          </div>
        </div>
      ) : null}

      <RemixDock />
      <CommandSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
