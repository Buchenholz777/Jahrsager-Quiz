import { Card } from "@/components/ui/card";
import { requireAdminPage } from "@/server/admin-session";
import { absoluteUrl } from "@/lib/site";

export const metadata = { title: "SEO-Vorschau" };

const PAGES = ["/", "/so-funktionierts", "/archiv", "/geschichte", "/impressum", "/datenschutz", "/spielen"];

type Info = { path: string; ok: boolean; title: string; description: string; canonical: string; robots: string; ogImage: string; status: number };

const pick = (html: string, re: RegExp) => (re.exec(html)?.[1] ?? "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").trim();

async function inspect(path: string): Promise<Info> {
  try {
    const res = await fetch(absoluteUrl(path), { cache: "no-store", signal: AbortSignal.timeout(8000) });
    const html = await res.text();
    return {
      path,
      ok: res.ok,
      status: res.status,
      title: pick(html, /<title>([^<]*)<\/title>/),
      description: pick(html, /<meta name="description" content="([^"]*)"/),
      canonical: pick(html, /<link rel="canonical" href="([^"]*)"/),
      robots: pick(html, /<meta name="robots" content="([^"]*)"/),
      ogImage: pick(html, /<meta property="og:image" content="([^"]*)"/),
    };
  } catch {
    return { path, ok: false, status: 0, title: "", description: "", canonical: "", robots: "", ogImage: "" };
  }
}

function hints(i: Info): string[] {
  const h: string[] = [];
  if (!i.ok) return [`Seite nicht abrufbar (Status ${i.status || "Fehler"}).`];
  if (!i.title) h.push("Titel fehlt.");
  else if (i.title.length > 60) h.push(`Titel hat ${i.title.length} Zeichen – Google kürzt ab ca. 60.`);
  if (!i.description) h.push("Beschreibung fehlt.");
  else if (i.description.length > 160) h.push(`Beschreibung hat ${i.description.length} Zeichen – wird ab ca. 160 gekürzt.`);
  if (!i.canonical) h.push("Canonical fehlt.");
  if (!i.ogImage) h.push("Kein Open-Graph-Bild.");
  return h;
}

export default async function SeoPreview() {
  await requireAdminPage();
  const infos = await Promise.all(PAGES.map(inspect));
  return (
    <div>
      <h1 className="text-3xl font-semibold">SEO-Vorschau</h1>
      <p className="mt-2 max-w-3xl text-ink-soft">
        Zeigt, wie die Seiten laut ihrem aktuellen HTML in der Google-Suche aussehen <em>könnten</em>. Das ist nur eine Simulation: Google entscheidet selbst über Titel, Beschreibung und Favicon,
        und zeigt sie erst nach einem neuen Crawl. Tatsächliche Darstellung und Wirkung stehen nur in der Search Console.
      </p>
      <div className="mt-6 space-y-4">
        {infos.map((i) => {
          const hs = hints(i);
          return (
            <Card key={i.path} className="p-5">
              <div className="text-xs text-ink-soft">{absoluteUrl(i.path)}</div>
              <div className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/favicon-48.png" alt="" width={18} height={18} className="size-[18px] rounded-full" />
                <span>JAHRSAGER</span>
              </div>
              <div className="mt-1 text-xl text-[#1a0dab]">{i.title || "(kein Titel)"}</div>
              <div className="mt-1 max-w-2xl text-sm text-ink-soft">{(i.description || "(keine Beschreibung)").slice(0, 160)}</div>
              <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs text-ink-soft sm:grid-cols-2">
                <div><dt className="inline font-semibold">Canonical: </dt><dd className="inline">{i.canonical || "–"}</dd></div>
                <div><dt className="inline font-semibold">Robots: </dt><dd className="inline">{i.robots || "index, follow (Standard)"}</dd></div>
              </dl>
              <ul className="mt-3 text-sm">
                {hs.length === 0 ? <li className="text-good">Keine Auffälligkeiten.</li> : hs.map((x) => <li key={x} className="text-ink">⚠ {x}</li>)}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
