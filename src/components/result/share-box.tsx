"use client";

import { Check, Copy, MessageCircle, Share2, Swords } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { whatsappUrl } from "@/lib/share";
import { sendMeasurement } from "@/components/beacon";
import { trackEvent } from "@/lib/tracking";

/** Spoilerfreies Teilen: native Freigabe (Smartphone), WhatsApp, Zwischenablage. */
export function ShareBox({ text, url }: { text: string; url: string }) {
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState("");
  useEffect(() => {
    queueMicrotask(() => setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function"));
  }, []);

  async function nativeShare() {
    try {
      await navigator.share({ title: "JAHRSAGER", text });
      sendMeasurement("share", { method: "native" });
      trackEvent("quiz_result_shared", { share_method: "native" });
    } catch {
      /* Abbruch durch Nutzer */
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setNote("Ergebnis kopiert.");
      sendMeasurement("share", { method: "kopieren" });
      trackEvent("quiz_result_shared", { share_method: "copy" });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setNote("Kopieren nicht möglich – markiere den Text und kopiere ihn manuell.");
    }
  }

  return (
    <div className="rounded-card border border-line bg-card p-5 shadow-card sm:p-6">
      <h2 className="text-2xl font-bold">Ergebnis teilen</h2>
      <p className="mt-1 text-sm text-ink-soft">Der Text verrät keine Lösungen und keine Ereignisse.</p>
      <pre
        className="mt-4 whitespace-pre-wrap break-words rounded-xl border border-line bg-paper p-4 font-sans text-[0.95rem] leading-relaxed"
        data-testid="share-text"
        aria-label="Vorschau des Teilen-Textes"
      >
        {text}
      </pre>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {canShare && (
          <Button variant="sun" size="lg" onClick={nativeShare} className="sm:col-span-2">
            <Share2 className="size-5" aria-hidden="true" /> Ergebnis teilen
          </Button>
        )}
        <a
          href={whatsappUrl(text)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            sendMeasurement("share", { method: "whatsapp" });
            trackEvent("share_opened", { share_method: "whatsapp" }); // geöffnet, nicht bestätigt
          }}
          className={buttonVariants({ size: "lg", className: "bg-good text-white hover:bg-good/90" })}
        >
          <MessageCircle className="size-5" aria-hidden="true" /> WhatsApp
        </a>
        <Button variant={canShare ? "secondary" : "sun"} size="lg" onClick={copy}>
          {copied ? <Check className="size-5" aria-hidden="true" /> : <Copy className="size-5" aria-hidden="true" />}
          {copied ? "Kopiert" : canShare ? "Kopieren" : "Ergebnis kopieren"}
        </Button>
      </div>
      <p role="status" className="mt-2 min-h-5 text-sm text-ink-soft">
        {note}
      </p>
      <div className="mt-3 flex items-start gap-3 rounded-xl bg-sun-soft p-4">
        <Swords className="mt-0.5 size-5 shrink-0 text-ink" aria-hidden="true" />
        <p className="text-sm">
          <strong>Fordere jemanden heraus:</strong> Wer schätzt die Jahre genauer? Der Link führt zur identischen Tagespartie:{" "}
          <span className="break-all text-ink-soft">{url}</span>
        </p>
      </div>
    </div>
  );
}
