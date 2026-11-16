import { categoryStyle, hashOf } from "@/lib/category-style";
import { categoryLabel } from "@/lib/types";
import { cx } from "./ui";

/**
 * Generated cover for an idea: a mesh of the category's colours with soft light
 * blobs, a large faint category glyph, and the title set in display type.
 * Pure CSS — no images to load, unique per idea, readable in both themes.
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
  const angle = h % 360;
  const x1 = 15 + (h % 50);
  const y1 = 10 + ((h >> 5) % 40);
  const x2 = 50 + ((h >> 9) % 45);
  const y2 = 55 + ((h >> 13) % 40);
  const Icon = s.icon;
  const small = variant === "tile";

  return (
    <div
      className={cx("relative isolate overflow-hidden", className)}
      style={{
        backgroundImage: [
          `radial-gradient(60% 55% at ${x1}% ${y1}%, ${s.from}ee, transparent 70%)`,
          `radial-gradient(55% 60% at ${x2}% ${y2}%, ${s.to}ee, transparent 70%)`,
          `linear-gradient(${angle}deg, ${s.from}, ${s.via} 50%, ${s.to})`,
        ].join(","),
      }}
    >
      {/* light blobs */}
      <div className="pointer-events-none absolute -right-[15%] -top-[20%] h-[70%] w-[70%] rounded-full bg-white/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-[25%] -left-[10%] h-[60%] w-[60%] rounded-full bg-black/25 blur-3xl" />
      <Icon
        aria-hidden
        strokeWidth={1.2}
        className={cx("pointer-events-none absolute text-white/20", small ? "-bottom-3 -right-3 h-20 w-20" : "-bottom-8 -right-8 h-56 w-56")}
        style={{ transform: `rotate(${(h % 40) - 20}deg)` }}
      />
      <div className={cx("relative flex h-full flex-col justify-between text-white", small ? "p-3" : variant === "hero" ? "p-7 md:p-9" : "p-6")}>
        <span
          className={cx(
            "inline-flex w-fit items-center gap-1.5 rounded-full border border-white/25 bg-white/15 font-semibold backdrop-blur-md",
            small ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-[11.5px]",
          )}
        >
          <Icon size={small ? 11 : 13} /> {categoryLabel(category)}
        </span>
        <div>
          <h3
            className={cx(
              "font-extrabold leading-[1.08] tracking-[-0.02em] drop-shadow-[0_2px_12px_rgba(0,0,0,0.25)]",
              small ? "line-clamp-3 text-[12px] sm:text-[17px] md:text-[20px]" : variant === "hero" ? "text-[2rem] md:text-[2.6rem]" : "text-[1.7rem] md:text-[1.9rem]",
            )}
          >
            {title}
          </h3>
          {summary && !small ? <p className="mt-3 line-clamp-2 max-w-md text-[14px] leading-snug text-white/85">{summary}</p> : null}
        </div>
      </div>
    </div>
  );
}

/** Round avatar in the category's gradient, used for post headers and stories. */
export function CategoryAvatar({ category, size = 32, ring = false }: { category: string; size?: number; ring?: boolean }) {
  const s = categoryStyle(category);
  const Icon = s.icon;
  const inner = (
    <span
      className="grid shrink-0 place-items-center rounded-full text-white"
      style={{ width: size, height: size, backgroundImage: `linear-gradient(135deg, ${s.from}, ${s.via}, ${s.to})` }}
    >
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
