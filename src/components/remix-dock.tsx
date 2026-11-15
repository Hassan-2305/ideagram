"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shuffle, X } from "lucide-react";
import { useApp } from "./providers";
import { buttonClass } from "./ui";

/** Floating tray of ideas the user picked for remixing, visible on every page except /remix. */
export function RemixDock() {
  const { tray, toggleTray, clearTray } = useApp();
  const pathname = usePathname();
  if (tray.length === 0 || pathname.startsWith("/remix")) return null;
  return (
    <div className="fixed inset-x-0 bottom-[76px] z-40 flex justify-center px-3 lg:bottom-6 lg:pl-60">
      <div className="flex max-w-full items-center gap-2 rounded-2xl border border-line bg-surface p-2 pl-3 shadow-float animate-sheet">
        <Shuffle size={16} className="shrink-0 text-accent" />
        <div className="no-scrollbar flex min-w-0 gap-1.5 overflow-x-auto">
          {tray.map((t) => (
            <span key={t.id} className="flex max-w-40 shrink-0 items-center gap-1 rounded-lg bg-surface-2 py-1 pl-2.5 pr-1 text-[12.5px] text-ink">
              <span className="truncate">{t.title}</span>
              <button onClick={() => toggleTray(t)} aria-label={`Remove ${t.title} from remix tray`} className="rounded p-0.5 text-ink-3 hover:text-ink">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <button onClick={clearTray} className="hidden shrink-0 px-1 text-[12px] text-ink-3 hover:text-ink sm:block">
          Clear
        </button>
        <Link href={`/remix?ids=${tray.map((t) => t.id).join(",")}`} className={buttonClass("primary", "sm", "shrink-0")}>
          Remix {tray.length}
        </Link>
      </div>
    </div>
  );
}
