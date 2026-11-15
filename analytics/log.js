// Visit logging. Called from functions/_middleware.js after a page has been
// served; writes one row to D1 per page view.
//
// This file is shared: the Art Moves repository (ryanbwatt/art-moves) carries
// an identical copy and writes to the same database, with its own `site`
// value. Change one, change the other. The tests live in ryanbwatt.com. Nothing here runs in the
// visitor's browser, sets a cookie, or changes the response.
//
// What a row holds: when, which page, where the visitor came from, roughly
// where they are, which network they are on, and a one-day pseudonymous id
// for counting unique visitors. The IP address itself is never stored.

const TZ = "America/New_York";

// Created on first use, so there is no migration step to run by hand.
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS visits (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     site TEXT NOT NULL DEFAULT 'ryanbwatt.com',
     ts INTEGER NOT NULL,
     day TEXT NOT NULL,
     path TEXT NOT NULL,
     via TEXT,
     referrer TEXT,
     country TEXT,
     region TEXT,
     city TEXT,
     asn INTEGER,
     network TEXT,
     device TEXT,
     bot INTEGER NOT NULL DEFAULT 0,
     visitor TEXT
   )`,
  `CREATE INDEX IF NOT EXISTS visits_day ON visits (day)`,
  `CREATE TABLE IF NOT EXISTS salts (day TEXT PRIMARY KEY, salt TEXT NOT NULL)`,
];

let schemaReady = false;
let saltCache = null; // { day, salt }

export async function ensureSchema(db) {
  if (schemaReady) return;
  await db.batch(SCHEMA.map((sql) => db.prepare(sql)));
  // The table predates the `site` column. Add it where it is missing; rows
  // written before then all came from ryanbwatt.com, which is the default.
  const has = await db
    .prepare("SELECT 1 AS yes FROM pragma_table_info('visits') WHERE name = 'site'")
    .first();
  if (!has) {
    try {
      await db
        .prepare("ALTER TABLE visits ADD COLUMN site TEXT NOT NULL DEFAULT 'ryanbwatt.com'")
        .run();
    } catch {
      // Another request added it first.
    }
  }
  schemaReady = true;
}

// YYYY-MM-DD in New York, so "today" on the admin page means the site
// owner's today rather than UTC's.
export function dayOf(ms) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

// Anything that announces itself as software rather than a person. Free
// Cloudflare plans don't expose a bot score, so this is the user agent only:
// a bot pretending to be Chrome is counted as a person.
const BOT =
  /bot|crawl|spider|slurp|preview|fetch|monitor|curl|wget|python|go-http|headless|lighthouse|scan|http-?client|okhttp|axios|node|ruby|java\/|libwww|facebookexternalhit|chatgpt|gptbot|claude|anthropic|perplexity|bytespider|yandex|bingpreview|uptime|pingdom|feed/i;

export function isBot(ua) {
  return !ua || BOT.test(ua);
}

export function deviceOf(ua) {
  if (!ua) return null;
  if (/ipad|tablet|android(?!.*mobile)/i.test(ua)) return "tablet";
  if (/mobi|iphone|android/i.test(ua)) return "phone";
  return "desktop";
}

// The other site's hostname, or null for direct visits and clicks within
// this site. The full referring URL is not kept.
export function referrerOf(header, ownHost) {
  if (!header) return null;
  try {
    const host = new URL(header).hostname.replace(/^www\./, "");
    if (!host || host === ownHost.replace(/^www\./, "")) return null;
    return host.slice(0, 100);
  } catch {
    return null;
  }
}

// ?via=joe on a link you hand out. Letters, digits, dot, dash, underscore.
export function viaOf(url) {
  const raw = url.searchParams.get("via");
  if (!raw) return null;
  const clean = raw.replace(/[^\w.-]/g, "").slice(0, 64);
  return clean || null;
}

export function pathOf(url) {
  const p = url.pathname.replace(/(.)\/+$/, "$1").replace(/\.html$/, "");
  return p.slice(0, 200) || "/";
}

// Only successful page views by GET. Not assets, not prefetches, not the
// admin page itself.
export function shouldLog(request, response) {
  if (request.method !== "GET") return false;
  if (response.status !== 200) return false;
  if (!(response.headers.get("content-type") || "").includes("text/html")) return false;
  if (/prefetch|prerender/i.test(request.headers.get("sec-purpose") || "")) return false;
  const path = new URL(request.url).pathname;
  if (path === "/admin" || path.startsWith("/admin/")) return false;
  return true;
}

// A random salt per day, kept only for that day. Once it is deleted the
// visitor ids from that day can no longer be tied back to an IP address,
// even by someone holding the database.
async function saltFor(db, day) {
  if (saltCache && saltCache.day === day) return saltCache.salt;
  const fresh = [...crypto.getRandomValues(new Uint8Array(16))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  await db.batch([
    db.prepare("INSERT OR IGNORE INTO salts (day, salt) VALUES (?, ?)").bind(day, fresh),
    db.prepare("DELETE FROM salts WHERE day < ?").bind(day),
  ]);
  const row = await db.prepare("SELECT salt FROM salts WHERE day = ?").bind(day).first();
  saltCache = { day, salt: row.salt };
  return row.salt;
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// `site` is a short fixed label for the site doing the logging, set in that
// site's functions/_middleware.js.
export async function logVisit(db, request, site, now = Date.now()) {
  await ensureSchema(db);

  const url = new URL(request.url);
  const cf = request.cf || {};
  const ua = request.headers.get("user-agent") || "";
  const ip = request.headers.get("cf-connecting-ip") || "";
  const day = dayOf(now);

  const salt = await saltFor(db, day);
  const visitor = (await sha256Hex(`${salt}|${ip}|${ua}`)).slice(0, 16);

  await db
    .prepare(
      `INSERT INTO visits
         (site, ts, day, path, via, referrer, country, region, city, asn, network, device, bot, visitor)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      site,
      now,
      day,
      pathOf(url),
      viaOf(url),
      referrerOf(request.headers.get("referer"), url.hostname),
      cf.country || null,
      cf.region || null,
      cf.city || null,
      cf.asn || null,
      cf.asOrganization ? String(cf.asOrganization).slice(0, 120) : null,
      deviceOf(ua),
      isBot(ua) ? 1 : 0,
      visitor,
    )
    .run();
}
