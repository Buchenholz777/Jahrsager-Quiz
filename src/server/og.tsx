import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { CLAIM, TAGLINE } from "@/lib/constants";

export const OG_SIZE = { width: 1200, height: 630 };

let font: Buffer | null = null;
let logo: string | null = null;
async function loadAssets() {
  font ??= await fs.readFile(path.join(process.cwd(), "node_modules", "@fontsource", "outfit", "files", "outfit-latin-800-normal.woff"));
  logo ??= `data:image/jpeg;base64,${(await fs.readFile(path.join(process.cwd(), "public", "brand", "jahrsager-quiz-logo-og.jpg"))).toString("base64")}`;
  return { font, logo };
}

/** Spoilerfreie Vorschaukarte (Open Graph) im JAHRSAGER-Design: Logo, Slogan, optional Rätselnummer. Keine Ereignisse, keine Lösungen. */
export async function ogCard(opts: { headline?: string; sub?: string; badge?: string }) {
  const { font: data, logo: logoUri } = await loadAssets();
  const lines = (opts.headline ?? CLAIM).split(/(?<=\.|\?)\s+/);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "#f7f5ef",
          color: "#16283d",
          padding: "0 64px",
          gap: 56,
          fontFamily: "Outfit",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUri} width={604} height={440} alt="" />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {opts.badge && (
            <div style={{ display: "flex", alignSelf: "flex-start", background: "#16283d", color: "#ffb34d", fontSize: 34, padding: "10px 26px", borderRadius: 60, marginBottom: 24 }}>
              {opts.badge}
            </div>
          )}
          <div style={{ fontSize: 64, lineHeight: 1.06, fontWeight: 800, display: "flex", flexDirection: "column" }}>
            {lines.map((l, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignSelf: "flex-start",
                  background: i === lines.length - 1 ? "#ffb34d" : "transparent",
                  padding: i === lines.length - 1 ? "0 12px" : 0,
                  borderRadius: 12,
                }}
              >
                {l}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 34, marginTop: 24, color: "#526175", display: "flex" }}>{opts.sub ?? TAGLINE}</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: [{ name: "Outfit", data, weight: 800, style: "normal" }] },
  );
}
