"use client";

import { Maximize2, RefreshCw, X } from "lucide-react";
import { useRef, useState } from "react";
import type { ImageInfo } from "@/lib/game-types";
import { imageSrc, imageSrcSet } from "@/lib/images";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * Historische Aufnahme im Originalseitenverhältnis (keine Filter, keine Verzerrung, kein Beschnitt).
 * Hoch- und Querformate werden in einer begrenzten Höhe gezeigt, damit Hochformate die mobile Seite nicht dominieren.
 * Antippen öffnet eine große Ansicht (natives <dialog>: Fokusfalle und Esc inklusive) – die Jahreseingabe bleibt erhalten.
 */
export function PhotoFrame({
  image,
  alt,
  credit,
  license,
  licenseUrl,
  priority,
  compact,
}: {
  image: ImageInfo;
  alt: string;
  credit?: string;
  license?: string;
  licenseUrl?: string;
  priority?: boolean;
  compact?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const src = imageSrc(image, image.ext === "svg" ? undefined : 1200) + (attempt ? `${image.ext === "svg" ? "?" : "&"}r=${attempt}` : "");
  const srcSet = imageSrcSet(image);
  const portrait = image.height > image.width * 1.05;

  return (
    <figure className="m-0">
      <div className={cn("relative overflow-hidden rounded-2xl border border-line bg-paper-2", compact && "max-w-md")}>
        <div className="relative">
          {failed ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="font-semibold">Das Bild konnte nicht geladen werden.</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setFailed(false);
                  setAttempt((a) => a + 1);
                }}
              >
                <RefreshCw className="size-4" /> Bild erneut laden
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => dialogRef.current?.showModal()}
              className="group block w-full cursor-zoom-in"
              aria-label={`Bild vergrößern: ${alt}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                srcSet={srcSet}
                sizes="(min-width: 1024px) 560px, 100vw"
                width={image.width}
                height={image.height}
                alt={alt}
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
                decoding="async"
                onError={() => setFailed(true)}
                className={cn(
                  "mx-auto block h-auto w-auto max-w-full object-contain",
                  portrait ? "max-h-[min(52svh,30rem)]" : "max-h-[min(60svh,34rem)]",
                )}
              />
              <span className="absolute bottom-2 right-2 inline-flex size-11 items-center justify-center rounded-full bg-ink/85 text-paper shadow-pop transition-[background-color,transform] duration-200 group-hover:bg-ink group-active:scale-95">
                <Maximize2 className="size-5" aria-hidden="true" />
              </span>
            </button>
          )}
          {image.placeholder && (
            <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-paper">
              Platzhalter · kein historisches Foto
            </span>
          )}
        </div>
      </div>
      {(credit || license) && (
        <figcaption className="mt-2 px-2 text-xs leading-snug text-ink-soft">
          {credit}
          {license && (
            <>
              {" · "}
              {licenseUrl?.startsWith("http") ? (
                <a href={licenseUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
                  {license}
                </a>
              ) : (
                license
              )}
            </>
          )}
        </figcaption>
      )}

      <dialog
        ref={dialogRef}
        className="m-auto max-h-[96dvh] max-w-[96vw] rounded-2xl bg-ink p-2 backdrop:bg-black/80"
        onClick={(e) => e.target === dialogRef.current && dialogRef.current?.close()}
        aria-label="Vergrößerte Ansicht des Bildes"
      >
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="absolute right-3 top-3 z-10 inline-flex size-11 items-center justify-center rounded-full bg-sun text-ink"
          aria-label="Vergrößerte Ansicht schließen"
        >
          <X className="size-5" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc(image, image.ext === "svg" ? undefined : 1600)}
          alt={alt}
          width={image.width}
          height={image.height}
          className="mx-auto block h-auto max-h-[90dvh] w-auto max-w-full rounded-xl object-contain"
        />
      </dialog>
    </figure>
  );
}
