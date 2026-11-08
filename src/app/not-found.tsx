import Link from "next/link";
import { Container } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container>
      <div className="mx-auto max-w-xl text-center">
        <p className="font-display text-7xl font-semibold text-line-strong">404</p>
        <h1 className="mt-2 text-3xl font-semibold">Diese Seite gibt es nicht</h1>
        <p className="mt-3 text-ink-soft">Die Seite existiert nicht oder ist noch nicht veröffentlicht.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className={buttonVariants()}>Zur Startseite</Link>
          <Link href="/spielen" className={buttonVariants({ variant: "secondary" })}>Jetzt Tagesrätsel spielen</Link>
        </div>
      </div>
    </Container>
  );
}
