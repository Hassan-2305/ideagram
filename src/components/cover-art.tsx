import type { CSSProperties } from "react";
import { categoryStyle, hashOf } from "@/lib/category-style";
import { categoryLabel } from "@/lib/types";
import { cx } from "./ui";

const ORDERS = [
  ["--p1", "--p2", "--p3"],
  ["--p3", "--p2", "--p1"],
  ["--p2", "--p1", "--p3"],
  ["--p2", "--p3", "--p1"],
  ["--p1", "--p3", "--p2"],
  ["--p3", "--p1", "--p2"],
];

/**
 * CSS variables for a cover/avatar. Palette mode permutes the active palette's
 * three colours per item; "vivid" mode (set on <html>) switches to the
 * category's own colours via CSS — no re-render needed.
 */
function coverVars(seed: string, category: string): CSSProperties {
  const s = categoryStyle(category);
  const h = hashOf(seed);
  const [k1, k2, k3] = ORDERS[h % ORDERS.length];
  return {
    "--k1": `var(${k1})`,
    "--k2": `var(${k2})`,
    "--k3": `var(${k3})`,
    "--cat1": s.from,
    "--cat2": s.via,
    "--cat3": s.to,
    "--ang": `${(h >> 3) % 360}deg`,
    "--x1": `${15 + (h % 50)}%`,
    "--y1": `${10 + ((h >> 5) % 40)}%`,
    "--x2": `${50 + ((h >> 9) % 45)}%`,
    "--y2": `${55 + ((h >> 13) % 40)}%`,
  } as CSSProperties;
}

/**
 * Generated cover for an idea: a soft mesh in the palette, light blobs, a large
 * faint category glyph and the title in display type. Pure CSS, unique per idea.
 */
export function CoverArt({
  id,
  title,
  category,
  summary,
  variant = "post",
  className,
}: {
  id: string;
  title: string;
  category: string;
  summary?: string;
  variant?: "post" | "tile" | "hero";
  className?: string;
}) {
  const s = categoryStyle(category);
  const h = hashOf(id);
  const Icon = s.icon;
  const small = variant === "tile";

  return (
    <div className={cx("cover-bg cover-ink relative isolate overflow-hidden", className)} style={coverVars(id, category)}>
      <div className="pointer-events-none absolute -right-[15%] -top-[20%] h-[70%] w-[70%] rounded-full bg-white/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-[25%] -left-[10%] h-[60%] w-[60%] rounded-full bg-black/20 blur-3xl" />
      <div className="cover-scrim pointer-events-none absolute inset-x-0 bottom-0 h-3/4" />
      <Icon
        aria-hidden
        strokeWidth={1.2}
        className={cx("pointer-events-none absolute opacity-20", small ? "-bottom-3 -right-3 h-20 w-20" : "-bottom-8 -right-8 h-56 w-56")}
        style={{ transform: `rotate(${(h % 40) - 20}deg)` }}
      />
      <div className={cx("relative flex h-full flex-col justify-between", small ? "p-3" : variant === "hero" ? "p-7 md:p-9" : "p-6")}>
        <span
          className={cx(
            "cover-chip inline-flex w-fit items-center gap-1.5 rounded-full border border-white/25 bg-white/15 font-semibold backdrop-blur-md",
            small ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-[11.5px]",
          )}
        >
          <Icon size={small ? 11 : 13} /> {categoryLabel(category)}
        </span>
        <div>
          <h3
            className={cx(
              "font-extrabold leading-[1.08] tracking-[-0.02em]",
              small ? "line-clamp-3 text-[12px] sm:text-[17px] md:text-[20px]" : variant === "hero" ? "text-[2rem] md:text-[2.6rem]" : "text-[1.7rem] md:text-[1.9rem]",
            )}
          >
            {title}
          </h3>
          {summary && !small ? <p className="mt-3 line-clamp-2 max-w-md text-[14px] leading-snug opacity-85">{summary}</p> : null}
        </div>
      </div>
    </div>
  );
}

/** Round avatar in the palette (or category colours in vivid mode), used for post headers and stories. */
export function CategoryAvatar({ category, size = 32, ring = false }: { category: string; size?: number; ring?: boolean }) {
  const s = categoryStyle(category);
  const Icon = s.icon;
  const inner = (
    <span className="avatar-bg cover-ink grid shrink-0 place-items-center rounded-full" style={{ width: size, height: size, ...coverVars(category, category) }}>
      <Icon size={Math.round(size * 0.48)} strokeWidth={2} />
    </span>
  );
  if (!ring) return inner;
  return (
    <span className="ring-brand grid shrink-0 place-items-center rounded-full p-[2.5px]">
      <span className="grid place-items-center rounded-full bg-bg p-[2.5px]">{inner}</span>
    </span>
  );
}
