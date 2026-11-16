import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white shadow-[0_8px_24px_-8px_rgba(124,58,237,0.6)] hover:brightness-110 hover:shadow-[0_10px_30px_-8px_rgba(124,58,237,0.75)]",
  secondary: "glass text-ink hover:bg-surface-3",
  outline: "border border-line-strong text-ink hover:bg-surface-2",
  ghost: "text-ink-2 hover:text-ink hover:bg-surface-2",
  danger: "bg-danger-soft text-danger hover:brightness-95",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[13px] gap-1.5 rounded-full",
  md: "h-10 px-5 text-sm gap-2 rounded-full",
  lg: "h-12 px-6 text-[15px] gap-2 rounded-full",
  icon: "h-9 w-9 rounded-full",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cx(
    "inline-flex items-center justify-center font-semibold whitespace-nowrap select-none transition-[background,color,transform,box-shadow] duration-150 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none",
    variants[variant],
    sizes[size],
    extra,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  loading,
  children,
  ...rest
}: ComponentProps<"button"> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={rest.disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cx("h-4 w-4 animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Card({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cx("glass rounded-3xl", className)} {...rest} />;
}

export function Chip({
  active,
  className,
  ...rest
}: ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cx(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[13px] font-medium transition-all",
        active ? "border-transparent bg-brand text-white shadow-[0_6px_18px_-8px_rgba(124,58,237,0.7)]" : "border-line bg-surface text-ink-2 backdrop-blur-xl hover:border-line-strong hover:text-ink",
        className,
      )}
      {...rest}
    />
  );
}

export function Badge({ tone = "neutral", className, children }: { tone?: "neutral" | "accent" | "success" | "warn" | "danger"; className?: string; children: ReactNode }) {
  const tones = {
    neutral: "bg-surface-2 text-ink-2",
    accent: "bg-accent-soft text-accent-text",
    success: "bg-success-soft text-success",
    warn: "bg-warn-soft text-warn",
    danger: "bg-danger-soft text-danger",
  };
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold capitalize", tones[tone], className)}>{children}</span>;
}

export function Label({ className, ...rest }: ComponentProps<"label">) {
  return <label className={cx("mb-1.5 block text-[13px] font-medium text-ink-2", className)} {...rest} />;
}

const field =
  "w-full rounded-2xl border border-line bg-surface px-4 text-[15px] text-ink placeholder:text-ink-3 backdrop-blur-xl transition-colors focus:border-line-strong focus:bg-surface-2 focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--ring)] [&>option]:bg-[#16133a] [&>option]:text-white";

export function Input({ className, ...rest }: ComponentProps<"input">) {
  return <input className={cx(field, "h-11", className)} {...rest} />;
}

export function Textarea({ className, ...rest }: ComponentProps<"textarea">) {
  return <textarea className={cx(field, "min-h-28 py-3 leading-relaxed", className)} {...rest} />;
}

export function Select({ className, ...rest }: ComponentProps<"select">) {
  return <select className={cx(field, "h-11 appearance-none bg-[length:16px] pr-9", className)} {...rest} />;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink-3">{children}</kbd>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton", className)} aria-hidden />;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("text-[13px] font-semibold text-ink-3", className)}>{children}</p>;
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between animate-fade-up">
      <div className="max-w-2xl">
        {eyebrow ? <p className="mb-2 text-[13px] font-semibold text-brand">{eyebrow}</p> : null}
        <h1 className="text-[2rem] font-extrabold leading-[1.08] tracking-[-0.03em] text-ink md:text-[2.6rem]">{title}</h1>
        {description ? <p className="mt-3 text-[15px] leading-relaxed text-ink-2 md:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function SectionHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-[17px] font-semibold tracking-tight text-ink">{title}</h2>
        {description ? <p className="mt-0.5 text-[13px] text-ink-3">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description: ReactNode; action?: ReactNode }) {
  return (
    <div className="glass flex flex-col items-center rounded-3xl px-6 py-14 text-center animate-fade-in">
      {icon ? <div className="bg-brand mb-4 grid h-14 w-14 place-items-center rounded-full text-white shadow-[0_10px_30px_-10px_rgba(124,58,237,0.8)]">{icon}</div> : null}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-2">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Notice({ tone = "warn", title, children }: { tone?: "warn" | "danger" | "neutral"; title: string; children?: ReactNode }) {
  const tones = { warn: "bg-warn-soft text-warn", danger: "bg-danger-soft text-danger", neutral: "bg-surface-2 text-ink-2" };
  return (
    <div role="status" className={cx("rounded-xl px-4 py-3 text-sm", tones[tone])}>
      <p className="font-medium">{title}</p>
      {children ? <div className="mt-1 opacity-90">{children}</div> : null}
    </div>
  );
}
