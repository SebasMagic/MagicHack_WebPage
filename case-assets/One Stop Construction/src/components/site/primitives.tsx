import type { ReactNode } from "react";
import { useInView } from "@/lib/site-motion";
import { cn } from "@/lib/utils";

export function Reveal({
  children,
  delay = 0,
  className,
  as: As = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span" | "p" | "h2";
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <As
      ref={ref as never}
      className={cn("reveal", inView && "reveal-in", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </As>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mono-label", className)}>{children}</div>;
}

const toneMap = {
  ok: "text-ok",
  warn: "text-warn",
  crit: "text-crit",
  muted: "text-ink-3",
  accent: "text-accent",
} as const;

export type Tone = keyof typeof toneMap;

export function StatusPill({
  tone = "muted",
  children,
  pulse = false,
}: {
  tone?: Tone;
  children: ReactNode;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-[20px] border border-line bg-surface-3/60 px-3 py-1",
        "font-mono text-[10px] uppercase tracking-[1.5px] whitespace-nowrap",
        toneMap[tone],
      )}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"
        style={pulse ? { animation: "dot-pulse 1.6s ease-in-out infinite" } : undefined}
      />
      {children}
    </span>
  );
}

export function ActionButton({
  children,
  variant = "primary",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  return (
    <button
      {...rest}
      className={cn(
        "display inline-flex items-center justify-center rounded-[12px] px-7 py-3.5 text-[19px] tracking-[3px]",
        "transition-[background-color,transform,border-color] duration-150 active:scale-[0.98]",
        variant === "primary"
          ? "bg-accent text-white hover:bg-accent-hover"
          : "border border-line-strong bg-surface-2 text-ink hover:bg-surface-3",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  children,
  href,
  variant = "primary",
  className,
}: {
  children: ReactNode;
  href: string;
  variant?: "primary" | "ghost";
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "display inline-flex items-center justify-center rounded-[12px] px-7 py-3.5 text-[19px] tracking-[3px]",
        "transition-[background-color,transform,border-color] duration-150 active:scale-[0.98]",
        variant === "primary"
          ? "bg-accent text-white hover:bg-accent-hover"
          : "border border-line-strong bg-surface-2 text-ink hover:bg-surface-3",
        className,
      )}
    >
      {children}
    </a>
  );
}

export function Section({
  id,
  children,
  className,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24 px-5 py-24 sm:px-8 md:py-32", className)}>
      <div className="mx-auto w-full max-w-[1360px]">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: string;
}) {
  return (
    <div className="max-w-[720px]">
      <Reveal>
        <Eyebrow>{eyebrow}</Eyebrow>
      </Reveal>
      <Reveal delay={60}>
        <h2 className="display mt-4 text-[clamp(34px,5.4vw,60px)] tracking-[2px]">{title}</h2>
      </Reveal>
      {sub ? (
        <Reveal delay={120}>
          <p className="mt-5 max-w-[56ch] text-[16px] text-ink-2">{sub}</p>
        </Reveal>
      ) : null}
    </div>
  );
}
