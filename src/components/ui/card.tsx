import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-card border border-line bg-card shadow-card", className)} {...props} />;
}

export function Badge({ className, tone = "neutral", ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "accent" | "good" | "warn" | "dark" }) {
  const tones = {
    neutral: "bg-paper-2 text-ink-soft",
    accent: "bg-sun text-ink",
    good: "bg-good-soft text-good",
    warn: "bg-sun-soft text-ink ring-1 ring-sun",
    dark: "bg-ink text-paper",
  };
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide", tones[tone], className)}
      {...props}
    />
  );
}

/** Kleine Überschrift mit gelbem Punkt. */
export function Eyebrow({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-ink-soft", className)} {...props}>
      <span aria-hidden="true" className="size-2 rounded-full bg-sun" />
      {children}
    </p>
  );
}
