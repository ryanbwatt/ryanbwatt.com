// The /admin page: reads the visits table and renders one plain HTML page.
// No chart library — tables, and bars made of divs. The only script is one
// inline handler that submits the site picker when it changes.

import { dayOf, ensureSchema } from "./log.js";

const TZ = "America/New_York";
const RANGES = [1, 7, 30, 90, 365];

// --- "Likely people"
//
// The plain people count is anything that didn't announce itself as a bot.
// Two kinds of traffic get past that and swell the headline number:
//
// 1. Requests from cloud and hosting networks. People browse from home ISPs,
//    phone carriers and offices; a request from AWS or Hetzner is almost
//    always a script with a browser user agent. Matched by ASN first, then by
//    network name for the long tail of small hosts.
//
//    Left out on purpose: Cloudflare, Akamai and Fastly (iCloud Private Relay
//    and WARP send real people through them) and Google's AS15169 (Google
//    offices). Microsoft's AS8075 is in: Azure scanners are far more common
//    than visits from Microsoft offices, and a Microsoft employee arriving by
//    a tagged link or a referrer still shows up in the people view.
export const CLOUD_ASNS = [
  16509, 14618, 8987, // Amazon / AWS
  396982, 19527, // Google Cloud
  8075, // Microsoft / Azure
  14061, // DigitalOcean
  24940, 213230, // Hetzner
  16276, // OVH
  63949, // Linode / Akamai Connected Cloud
  20473, // Vultr / Choopa
  31898, // Oracle Cloud
  45102, 37963, // Alibaba
  132203, 45090, // Tencent
  51167, // Contabo
  12876, // Scaleway
  9009, // M247
  212238, // Datacamp
  36352, // ColoCrossing
  60781, 28753, // Leaseweb
  8100, // QuadraNet
  8560, // IONOS
  202425, // IP Volume
  46606, // Unified Layer
  63023, // GTHost
  396356, // Latitude.sh
];
const CLOUD_NAMES = ["%hosting%", "%datacenter%", "%data center%", "%server%", "%colo%", "%vps%"];

const IS_CLOUD =
  `(asn IN (${CLOUD_ASNS.join(", ")}) OR ` +
  CLOUD_NAMES.map((p) => `LOWER(COALESCE(network, '')) LIKE '${p}'`).join(" OR ") +
  `)`;

// 2. One-hit homepage visits: a visitor whose whole day on that site was one
//    view of "/", with no referrer and no ?via= tag. That is the shape of a
//    link-preview fetch, a scanner, or someone who typed the address and left.
//    With a referrer or a tag there is evidence of a person, so those stay.
const IS_ONE_HIT = `(path = '/' AND referrer IS NULL AND via IS NULL AND (
    SELECT COUNT(*) FROM visits w
    WHERE w.site = visits.site AND w.day = visits.day AND w.visitor = visits.visitor AND w.bot = 0
  ) = 1)`;

// A row is a likely person if it isn't a bot and is neither of the above.
export const LIKELY = `(bot = 0 AND NOT ${IS_CLOUD} AND NOT ${IS_ONE_HIT})`;

// Every value shown here arrived from a stranger's request (paths, referrers,
// network names, ?via= tags), so everything is escaped on the way out.
export function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

const n = (value) => Number(value || 0).toLocaleString("en-US");

function when(ms) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));
}

function place(row) {
  return [row.city, row.region, row.country].filter(Boolean).join(", ") || "Unknown";
}

export function parseOptions(url) {
  const asked = Number(url.searchParams.get("days"));
  const site = url.searchParams.get("site") || "";
  return {
    days: RANGES.includes(asked) ? asked : 30,
    bots: url.searchParams.get("bots") === "1",
    likely: url.searchParams.get("likely") === "1",
    // "" means every site. Anything else is matched against the table, so an
    // unknown name just shows an empty report.
    site: /^[\w.-]{1,64}$/.test(site) ? site : "",
  };
}

export async function loadReport(db, { days, bots, likely = false, site = "" }, now = Date.now()) {
  // The two filters are exclusive; the likely view wins.
  if (likely) bots = false;
  await ensureSchema(db);

  const today = dayOf(now);
  const since = dayOf(now - (days - 1) * 86_400_000);
  // ?1 is always the first day of the range and ?2 the site ("" for all).
  const who = `${likely ? `AND ${LIKELY}` : bots ? "" : "AND bot = 0"} AND (?2 = '' OR site = ?2)`;
  const all = (sql) =>
    db.prepare(sql).bind(since, site).all().then((r) => r.results || []);

  const [totals, known, sites, daily, pages, referrers, networks, places, tags, recent] = await Promise.all([
    db
      .prepare(
        `SELECT
           SUM(CASE WHEN bot = 0 THEN 1 ELSE 0 END) AS views,
           COUNT(DISTINCT CASE WHEN bot = 0 THEN visitor END) AS visitors,
           SUM(CASE WHEN bot = 0 AND day = ?3 THEN 1 ELSE 0 END) AS views_today,
           COUNT(DISTINCT CASE WHEN bot = 0 AND day = ?3 THEN visitor END) AS visitors_today,
           SUM(bot) AS bot_views,
           SUM(CASE WHEN ${LIKELY} THEN 1 ELSE 0 END) AS likely_views,
           COUNT(DISTINCT CASE WHEN ${LIKELY} THEN visitor END) AS likely_visitors,
           COUNT(DISTINCT CASE WHEN ${LIKELY} AND day = ?3 THEN visitor END) AS likely_visitors_today,
           COUNT(DISTINCT CASE WHEN bot = 0 AND ${IS_CLOUD} THEN visitor END) AS cloud_visitors,
           COUNT(DISTINCT CASE WHEN bot = 0 AND NOT ${IS_CLOUD} AND ${IS_ONE_HIT} THEN visitor END) AS one_hit_visitors
         FROM visits WHERE day >= ?1 AND (?2 = '' OR site = ?2)`,
      )
      .bind(since, site, today)
      .first(),
    // Every site that has ever logged a visit, for the picker. A site with
    // nothing in the current range still has to be selectable.
    db
      .prepare(`SELECT DISTINCT site FROM visits ORDER BY site`)
      .all()
      .then((r) => (r.results || []).map((row) => row.site)),
    // Per-site totals for the range, whatever the filter.
    db
      .prepare(
        `SELECT site,
                SUM(CASE WHEN bot = 0 THEN 1 ELSE 0 END) AS views,
                COUNT(DISTINCT CASE WHEN bot = 0 THEN visitor END) AS visitors,
                COUNT(DISTINCT CASE WHEN ${LIKELY} THEN visitor END) AS likely
         FROM visits WHERE day >= ?1 GROUP BY site ORDER BY views DESC`,
      )
      .bind(since)
      .all()
      .then((r) => r.results || []),
    all(
      `SELECT day, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors
       FROM visits WHERE day >= ?1 ${who} GROUP BY day ORDER BY day DESC`,
    ),
    all(
      `SELECT site, path, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors
       FROM visits WHERE day >= ?1 ${who} GROUP BY site, path ORDER BY views DESC LIMIT 30`,
    ),
    all(
      `SELECT referrer, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors
       FROM visits WHERE day >= ?1 ${who} AND referrer IS NOT NULL
       GROUP BY referrer ORDER BY views DESC LIMIT 20`,
    ),
    all(
      `SELECT network, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors, MAX(ts) AS last
       FROM visits WHERE day >= ?1 ${who} AND network IS NOT NULL
       GROUP BY network ORDER BY visitors DESC, views DESC LIMIT 40`,
    ),
    all(
      `SELECT city, region, country, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors
       FROM visits WHERE day >= ?1 ${who}
       GROUP BY city, region, country ORDER BY visitors DESC, views DESC LIMIT 25`,
    ),
    all(
      `SELECT via, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors,
              MIN(ts) AS first, MAX(ts) AS last
       FROM visits WHERE day >= ?1 ${who} AND via IS NOT NULL
       GROUP BY via ORDER BY last DESC LIMIT 40`,
    ),
    all(
      `SELECT site, ts, path, via, referrer, city, region, country, network, device, bot
       FROM visits WHERE day >= ?1 ${who} ORDER BY ts DESC LIMIT 60`,
    ),
  ]);

  return { days, bots, likely, site, known, sites, since, today, totals: totals || {}, daily, pages, referrers, networks, places, tags, recent };
}

function table(head, rows, empty) {
  if (!rows.length) return `<p class="none">${esc(empty)}</p>`;
  return (
    `<div class="scroll"><table><thead><tr>` +
    head.map(([label, cls]) => `<th${cls ? ` class="${cls}"` : ""}>${esc(label)}</th>`).join("") +
    `</tr></thead><tbody>` +
    rows.map((cells) => `<tr>${cells.join("")}</tr>`).join("") +
    `</tbody></table></div>`
  );
}

const td = (value) => `<td>${esc(value)}</td>`;
const num = (value) => `<td class="num">${n(value)}</td>`;

export function renderReport(report, email) {
  const { days, bots, likely = false, site, known, sites, totals, daily, pages, referrers, networks, places, tags, recent } = report;
  // b is the view: "likely", "bots", or "" for people (the default).
  const view = likely ? "likely" : bots ? "bots" : "";
  const link = (d, b = view, s = site) =>
    `/admin?days=${d}${b === "likely" ? "&likely=1" : b === "bots" ? "&bots=1" : ""}${s ? `&site=${encodeURIComponent(s)}` : ""}`;
  // With every site shown together, a path needs its site in front of it.
  const where = (r) => (site ? r.path : `${r.site}${r.path}`);
  // The picker is a plain GET form, so it works as a link would. Choosing a
  // site submits it; the button is only there for a browser with scripts off.
  // A site asked for in the address but not in the table is still listed, so
  // the control always shows what the page is filtered to.
  const options = [...new Set([...known, ...(site ? [site] : [])])].sort();
  const picker =
    `<form method="get" action="/admin">` +
    `<input type="hidden" name="days" value="${days}">` +
    (bots ? `<input type="hidden" name="bots" value="1">` : "") +
    (likely ? `<input type="hidden" name="likely" value="1">` : "") +
    `<label for="site">Site</label> ` +
    `<select id="site" name="site" onchange="this.form.submit()">` +
    `<option value=""${site ? "" : " selected"}>All sites</option>` +
    options
      .map((s) => `<option value="${esc(s)}"${s === site ? " selected" : ""}>${esc(s)}</option>`)
      .join("") +
    `</select> <noscript><button type="submit">Show</button></noscript></form>`;
  const rangeLabel = (d) => (d === 1 ? "Today" : d === 365 ? "1 year" : `${d} days`);
  const peak = Math.max(1, ...daily.map((d) => d.views));

  const ranges = [1, 7, 30, 90, 365]
    .map((d) =>
      d === days ? `<b>${rangeLabel(d)}</b>` : `<a href="${link(d)}">${rangeLabel(d)}</a>`,
    )
    .join(" · ");

  const body = `
<p class="title"><b>Visits</b></p>
${picker}
<p class="top">
  ${ranges}<br>
  ${[
    ["likely", "Likely people"],
    ["", "People"],
    ["bots", "Everything, bots included"],
  ]
    .map(([v, label]) => (v === view ? `<b>${label}</b>` : `<a href="${link(days, v)}">${label}</a>`))
    .join(" · ")}
</p>
${
  likely
    ? `<p class="none">Hiding cloud and hosting networks (${n(totals.cloud_visitors)} visitors) and
  one-hit homepage visits with no referrer or tag (${n(totals.one_hit_visitors)} visitors).
  Every table below is filtered the same way.</p>`
    : ""
}

<table class="totals"><tbody>
  <tr><td>Page views</td><td class="num">${n(totals.views)}</td></tr>
  <tr><td><b>Likely people</b></td><td class="num"><b>${n(totals.likely_visitors)}</b></td></tr>
  <tr><td>Visitors</td><td class="num">${n(totals.visitors)}</td></tr>
  <tr><td>Page views today</td><td class="num">${n(totals.views_today)}</td></tr>
  <tr><td>Likely people today</td><td class="num">${n(totals.likely_visitors_today)}</td></tr>
  <tr><td>Visitors today</td><td class="num">${n(totals.visitors_today)}</td></tr>
  <tr><td>Bot requests, not counted above</td><td class="num">${n(totals.bot_views)}</td></tr>
</tbody></table>

${
  site
    ? ""
    : `<h2>Sites</h2>
${table(
  [["Site"], ["Likely people", "num"], ["Visitors", "num"], ["Views", "num"]],
  sites.map((s) => [td(s.site), num(s.likely), num(s.visitors), num(s.views)]),
  "Nothing yet.",
)}`
}

<h2>By day</h2>
${table(
  [["Day"], ["Visitors", "num"], ["Views", "num"], [""]],
  daily.map((d) => [
    td(d.day),
    num(d.visitors),
    num(d.views),
    `<td class="bar"><div style="width:${Math.max(1, Math.round((d.views / peak) * 120))}px"></div></td>`,
  ]),
  "No visits recorded in this period.",
)}

<h2>Tagged links</h2>
${table(
  [["Tag"], ["Visitors", "num"], ["Views", "num"], ["First opened"], ["Last opened"]],
  tags.map((t) => [td(t.via), num(t.visitors), num(t.views), td(when(t.first)), td(when(t.last))]),
  "None yet. Add ?via=name to a link you send, e.g. ryanwatt.ca/about?via=joe, and it shows up here when it is opened.",
)}

<h2>Networks</h2>
${table(
  [["Network"], ["Visitors", "num"], ["Views", "num"], ["Last seen"]],
  networks.map((r) => [td(r.network), num(r.visitors), num(r.views), td(when(r.last))]),
  "Nothing yet.",
)}

<h2>Pages</h2>
${table(
  [["Page"], ["Visitors", "num"], ["Views", "num"]],
  pages.map((r) => [td(where(r)), num(r.visitors), num(r.views)]),
  "Nothing yet.",
)}

<h2>Came from</h2>
${table(
  [["Site"], ["Visitors", "num"], ["Views", "num"]],
  referrers.map((r) => [td(r.referrer), num(r.visitors), num(r.views)]),
  "No visits from other sites yet. Typed addresses, bookmarks, and most links in email and messaging apps arrive with no referrer.",
)}

<h2>Places</h2>
${table(
  [["Place"], ["Visitors", "num"], ["Views", "num"]],
  places.map((r) => [td(place(r)), num(r.visitors), num(r.views)]),
  "Nothing yet.",
)}

<h2>Latest ${recent.length ? n(recent.length) : ""} views</h2>
${table(
  [["When"], ["Page"], ["Network"], ["Place"], ["From"], ["Tag"], ["Device"]],
  recent.map((r) => [
    td(when(r.ts)),
    td(where(r)),
    td((r.network || "") + (r.bot ? " (bot)" : "")),
    td(place(r)),
    td(r.referrer || ""),
    td(r.via || ""),
    td(r.device || ""),
  ]),
  "Nothing yet.",
)}

<p class="foot">
  Times are New York. A visitor is one device on one network on one day; the
  same person on a phone and a laptop counts twice, and again the next day.
  Network is whoever owns the connection: a company name for an office, an
  internet provider for a home or phone. IP addresses are not stored.
  Likely people leaves out visitors on cloud and hosting networks and visitors
  whose only view that day was the homepage with no referrer or tag. It is a
  floor, not an exact count.<br>
  Signed in as ${esc(email)}.
</p>`;

  return page(body);
}

export function page(body, title = "Visits") {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title)} · Ryan Watt</title>
<style>
body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 13px; line-height: 18px; color: #333; background: #fff; margin: 0; }
#admin { margin: 30px 20px 60px 200px; max-width: 960px; }
a { color: #0864c7; }
b, h2, th { color: #000; }
h2 { font-size: 13px; line-height: 18px; margin: 36px 0 6px; }
p { margin: 0 0 18px; }
.title { margin-bottom: 6px; }
form { margin: 0 0 8px; }
select, button { font: inherit; color: #000; }
table { border-collapse: collapse; }
th, td { text-align: left; vertical-align: top; padding: 0 24px 0 0; font-weight: normal; white-space: nowrap; }
th { font-weight: bold; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
.bar div { height: 9px; margin-top: 5px; background: #333; }
.scroll { overflow-x: auto; }
.none, .foot { color: #595959; max-width: 500px; }
.foot { margin-top: 48px; }
@media (max-width: 720px) {
  #admin { margin: 20px; }
  th, td { padding-right: 14px; }
}
</style>
</head>
<body>
<div id="admin">
${body}
</div>
</body>
</html>`;
}
