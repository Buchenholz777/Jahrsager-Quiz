import type { ImageInfo } from "./game-types";

export const IMAGE_WIDTHS = [480, 800, 1200, 1600] as const;

export function imageSrc(img: Pick<ImageInfo, "id">, w?: number) {
  return `/bild/${img.id}${w ? `?w=${w}` : ""}`;
}

/** SVG-Platzhalter sind skalierbar und brauchen kein srcset. */
export function imageSrcSet(img: ImageInfo): string | undefined {
  if (img.ext === "svg") return undefined;
  return IMAGE_WIDTHS.filter((w) => w <= img.width * 1.05 || w === IMAGE_WIDTHS[0])
    .map((w) => `${imageSrc(img, w)} ${w}w`)
    .join(", ");
}
