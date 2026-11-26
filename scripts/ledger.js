// Time Reclaimed ledger: turns the private time-saved.md log into the HTML
// table on /workflows. Pure functions only; scripts/sync-ledger.mjs does the
// file reading and writing. Nothing here runs at build time or in the browser.
//
// Expected source: a Markdown table anywhere in time-saved.md with these
// headers (case and order don't matter; extra columns are ignored):
//
//   | Task | Tools | Before | After | Runs/mo | Public |
//
// Before / After are time per run: "90", "90 min", "1.5 h", "1h 30m".
// Only rows whose Public cell is yes / y / true are published. The Task text
// must already be anonymized in the log; the deny list is the backstop.

export const START = "<!-- ledger:start -->";
export const END = "<!-- ledger:end -->";

const COLUMNS = {
  task: ["task"],
  tools: ["tools", "tools/skills", "skill", "skills"],
  before: ["before"],
  after: ["after"],
  runs: ["runs/mo", "runs/month", "runs a month", "runs", "per month"],
  public: ["public", "publish"],
};

/** Minutes from "90", "90 min", "1.5 h", "1h 30m". NaN if unreadable. */
export function minutes(text) {
  const s = String(text).trim().toLowerCase();
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s);
  const h = s.match(/(\d+(?:\.\d+)?)\s*h/);
  const m = s.match(/(\d+(?:\.\d+)?)\s*m(?!o)/);
  if (!h && !m) return NaN;
  return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);
}

function cells(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

/** Rows from the first table in the text that has every required column. */
export function parse(markdown) {
  const lines = markdown.split("\n");
  for (let i = 0; i < lines.length - 1; i++) {
    if (!lines[i].trim().startsWith("|") || !/^\s*\|?\s*:?-{3}/.test(lines[i + 1])) continue;
    const head = cells(lines[i]).map((c) => c.toLowerCase());
    const idx = {};
    for (const [key, names] of Object.entries(COLUMNS)) {
      idx[key] = head.findIndex((h) => names.includes(h));
    }
    if (Object.values(idx).some((n) => n < 0)) continue;

    const rows = [];
    for (let j = i + 2; j < lines.length && lines[j].trim().startsWith("|"); j++) {
      const c = cells(lines[j]);
      rows.push({
        task: c[idx.task] ?? "",
        tools: c[idx.tools] ?? "",
        before: minutes(c[idx.before] ?? ""),
        after: minutes(c[idx.after] ?? ""),
        runs: Number(c[idx.runs]),
        public: /^(y|yes|true)$/i.test(c[idx.public] ?? ""),
      });
    }
    return rows;
  }
  throw new Error(
    "No ledger table found. Need columns: Task, Tools, Before, After, Runs/mo, Public.",
  );
}

/** Public rows only, checked against the deny list and for readable numbers. */
export function select(rows, deny = []) {
  const terms = deny.map((t) => t.trim().toLowerCase()).filter(Boolean);
  const out = rows.filter((r) => r.public);
  for (const r of out) {
    const text = `${r.task} ${r.tools}`.toLowerCase();
    const hit = terms.find((t) => text.includes(t));
    if (hit) throw new Error(`Deny-listed term "${hit}" in public row: ${r.task}`);
    if ([r.before, r.after, r.runs].some((n) => !Number.isFinite(n))) {
      throw new Error(`Unreadable time or runs in public row: ${r.task}`);
    }
  }
  return out;
}

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const fmtMin = (n) => (n >= 60 && n % 60 === 0 ? `${n / 60} h` : n >= 60 ? `${(n / 60).toFixed(1)} h` : `${n} min`);

export const hoursSaved = (r) => ((r.before - r.after) * r.runs) / 60;

/** The table that sits between the markers on /workflows. */
export function render(rows) {
  const sorted = [...rows].sort((a, b) => hoursSaved(b) - hoursSaved(a));
  const total = sorted.reduce((sum, r) => sum + hoursSaved(r), 0);
  const body = sorted
    .map(
      (r) =>
        `    <tr><td>${esc(r.task)}</td><td>${esc(r.tools)}</td>` +
        `<td>${fmtMin(r.before)}</td><td>${fmtMin(r.after)}</td><td>${hoursSaved(r).toFixed(1)}</td></tr>`,
    )
    .join("\n");
  return [
    '<table id="ledger">',
    "  <thead>",
    "    <tr><th>Task</th><th>Tools</th><th>Before</th><th>After</th><th>Hours a month</th></tr>",
    "  </thead>",
    "  <tbody>",
    body,
    `    <tr><td>Total</td><td></td><td></td><td></td><td>${total.toFixed(1)}</td></tr>`,
    "  </tbody>",
    "</table>",
  ].join("\n");
}

/** Page text with everything between the markers replaced. */
export function splice(page, table) {
  const a = page.indexOf(START);
  const b = page.indexOf(END);
  if (a < 0 || b < a) throw new Error(`Markers ${START} / ${END} not found in the page.`);
  return `${page.slice(0, a + START.length)}\n${table}\n${page.slice(b)}`;
}
