import { Eyebrow } from "@/components/ui/card";

export function PageHeader({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: React.ReactNode }) {
  return (
    <header className="mb-8 max-w-3xl">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1 className="mt-2 text-[2rem] font-bold leading-tight sm:text-5xl">{title}</h1>
      {lead && <p className="mt-4 text-lg text-ink-soft">{lead}</p>}
    </header>
  );
}

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 ${className}`}>{children}</div>;
}
