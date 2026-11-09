import fs from "node:fs";
import path from "node:path";
import { simulate, syntheticPool } from "../src/server/pipeline/simulate";

/** Erzeugt docs/AUSWAHL-SIMULATION.md: 30 simulierte Tagespartien (150 Plätze) mit SYNTHETISCHEN Metadaten. */
const pct = (x: number) => (x * 100).toFixed(1).replace(".", ",") + " %";
let md = `# Simulation der Tagesrätsel-Auswahl (synthetisch)

**Wichtig:** Alle Ereignisse in dieser Simulation sind **synthetische Testdaten** (reproduzierbar erzeugt, keine echten Ereignisse). Es gibt derzeit **keine 150 produktionsreifen Ereignisse**; die Simulation prüft nur, ob der Algorithmus seine Regeln einhält.

Regeln (hart): ≥ 4 Themenfelder und ≤ 2 je Themenfeld; ≥ 3 Jahrzehnte; keine Region mit ≥ 3 von 5 (ohne „global“); Raumfahrt höchstens einmal je 20 Ereignisse und höchstens eins je Paket; keine ähnlichen Ereignisse (gleicher Themenschlüssel oder ≥ 2 gleiche Schlagwörter) im Paket und innerhalb der letzten 10 Ereignisse; Schwierigkeit 2 leicht / 2 mittel / 1 schwer; keine Wiederholung.

`;
for (const [name, pool] of [["Ausgewogener Pool (400 Ereignisse)", syntheticPool(400, 11, false)], ["Einseitiger Pool (500 Ereignisse; 25 % Raumfahrt, 20 % Technik, Schwerpunkt 1960er–1980er)", syntheticPool(500, 12, true)]] as const) {
  const poolRaum = pool.filter((e) => e.category === "raumfahrt").length / pool.length;
  const r = simulate(pool, 30);
  md += `## ${name}\n\n- Pool: Raumfahrt-Anteil ${pct(poolRaum)}\n- Simulierte Tage: 30 (${r.packs.flat().length} Ereignisplätze), nicht planbare Tage: ${r.failed}, Regelverstöße: ${r.violations.length}, gelockerte Schwierigkeit: ${r.warnings}\n- **Raumfahrt in der Auswahl: ${pct(r.dist.spaceShare)}** (Pool: ${pct(poolRaum)})\n- Wissenschaft + Technik zusammen: ${pct(r.dist.sciTechShare)}\n\n| Themenfeld | Anzahl | Anteil |\n|---|--:|--:|\n`;
  for (const c of r.dist.byCategory) md += `| ${c.label} | ${c.n} | ${pct(c.share)} |\n`;
  md += `\n| Region | Anzahl | Anteil |\n|---|--:|--:|\n`;
  for (const c of r.dist.byRegion) md += `| ${c.label} | ${c.n} | ${pct(c.share)} |\n`;
  md += `\n| Jahrzehnt | Anzahl | Anteil |\n|---|--:|--:|\n`;
  for (const c of r.dist.byDecade) md += `| ${c.decade}er | ${c.n} | ${pct(c.share)} |\n`;
  md += `\n| Zeitfenster | Raumfahrt | Themenfelder | Jahrzehnte |\n|---|--:|--:|--:|\n`;
  for (const w of r.perWindow) md += `| ${w.days} Tage | ${w.space} | ${w.categories} | ${w.decades} |\n`;
  md += "\n";
}
fs.writeFileSync(path.join(process.cwd(), "docs", "AUSWAHL-SIMULATION.md"), md);
console.log(md);
