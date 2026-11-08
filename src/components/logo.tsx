import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * JAHRSAGER-QUIZ-Logo (transparent freigestellt, aus dem bereitgestellten Artwork, ergänzt um das „QUIZ“-Schild).
 * Die Größe wird über die Höhe gesteuert (className). Erzeugt mit `scripts/brand-logo.ts`.
 */
export function Logo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/jahrsager-quiz-logo-640.webp"
      alt="JAHRSAGER QUIZ"
      width={640}
      height={466}
      sizes="(min-width: 768px) 140px, 100px"
      priority={priority}
      className={cn("h-[3.75rem] w-auto md:h-[5rem]", className)}
    />
  );
}

/** Größere Darstellung des Logos (höhere Auflösung) für Footer und Anmeldung. */
export function LogoLarge({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/jahrsager-quiz-logo.webp"
      alt="JAHRSAGER QUIZ"
      width={1200}
      height={873}
      sizes="260px"
      className={cn("h-32 w-auto", className)}
    />
  );
}

/** Kleine Jahreszeitleiste als dekoratives Motiv. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 24" aria-hidden="true" className={cn("h-5 w-auto", className)}>
      <line x1="4" y1="12" x2="60" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {[6, 18, 46, 58].map((x) => (
        <circle key={x} cx={x} cy="12" r="3" fill="currentColor" />
      ))}
      <circle cx="32" cy="12" r="7.5" fill="var(--color-sun)" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
