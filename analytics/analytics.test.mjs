// npm test
import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";

import { dayOf, deviceOf, isBot, pathOf, referrerOf, shouldLog, viaOf } from "./log.js";
import { teamHost, verifyAccess } from "./access.js";
import { esc, loadReport, parseOptions, renderReport } from "./report.js";
import { DatabaseSync } from "node:sqlite";
import { canonicalRedirect } from "../functions/_middleware.js";

const CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

test("bots and devices", () => {
  assert.equal(isBot(CHROME), false);
  assert.equal(isBot(IPHONE), false);
  assert.equal(isBot(""), true);
  assert.equal(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
  assert.equal(isBot("curl/8.5.0"), true);
  assert.equal(isBot("Mozilla/5.0 AppleWebKit/537.36 (compatible; Perplexity-User/1.0)"), true);
  assert.equal(deviceOf(CHROME), "desktop");
  assert.equal(deviceOf(IPHONE), "phone");
});

test("referrer keeps only another site's hostname", () => {
  assert.equal(referrerOf("https://www.linkedin.com/feed/?x=1", "ryanbwatt.com"), "linkedin.com");
  assert.equal(referrerOf("https://ryanbwatt.com/about", "ryanbwatt.com"), null);
  assert.equal(referrerOf("https://www.ryanbwatt.com/about", "ryanbwatt.com"), null);
  assert.equal(referrerOf("not a url", "ryanbwatt.com"), null);
  assert.equal(referrerOf(null, "ryanbwatt.com"), null);
});

test("via tag and path are cleaned", () => {
  assert.equal(viaOf(new URL("https://x.test/about?via=joe")), "joe");
  assert.equal(viaOf(new URL("https://x.test/about?via=<script>alert(1)</script>")), "scriptalert1script");
  assert.equal(viaOf(new URL("https://x.test/about")), null);
  assert.equal(pathOf(new URL("https://x.test/about/")), "/about");
  assert.equal(pathOf(new URL("https://x.test/about.html")), "/about");
  assert.equal(pathOf(new URL("https://x.test/")), "/");
});

test("only successful HTML page views are logged", () => {
  const page = new Response("", { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
  const missing = new Response("", { status: 404, headers: { "content-type": "text/html" } });
  const image = new Response("", { status: 200, headers: { "content-type": "image/jpeg" } });
  assert.equal(shouldLog(new Request("https://x.test/about"), page), true);
  assert.equal(shouldLog(new Request("https://x.test/nope"), missing), false);
  assert.equal(shouldLog(new Request("https://x.test/a.jpg"), image), false);
  assert.equal(shouldLog(new Request("https://x.test/admin"), page), false);
  assert.equal(shouldLog(new Request("https://x.test/about", { method: "POST" }), page), false);
  assert.equal(
    shouldLog(new Request("https://x.test/about", { headers: { "sec-purpose": "prefetch" } }), page),
    false,
  );
});

test("days are New York days", () => {
  // 03:30 UTC on Nov 15 is still Nov 14 in New York.
  assert.equal(dayOf(Date.UTC(2026, 10, 15, 3, 30)), "2026-11-14");
});

test("report output is escaped and options are bounded", () => {
  assert.equal(esc(`<img src=x onerror="a">`), "&lt;img src=x onerror=&quot;a&quot;&gt;");
  assert.deepEqual(parseOptions(new URL("https://x.test/admin?days=7&bots=1")), { days: 7, bots: true, likely: false, site: "" });
  assert.deepEqual(parseOptions(new URL("https://x.test/admin?days=9999")), { days: 30, bots: false, likely: false, site: "" });
  assert.equal(parseOptions(new URL("https://x.test/admin?likely=1")).likely, true);
  assert.equal(parseOptions(new URL("https://x.test/admin?site=art-moves")).site, "art-moves");
  assert.equal(parseOptions(new URL("https://x.test/admin?site=a'%20OR%201=1")).site, "");
});

// --- Access token verification, against a key pair made for the test.

const TEAM = "example.cloudflareaccess.com";
const AUD = "aud-tag-123";
const b64url = (bytes) => Buffer.from(bytes).toString("base64url");

async function makeSigner(kid) {
  const pair = await webcrypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  const jwk = { ...(await webcrypto.subtle.exportKey("jwk", pair.publicKey)), kid };
  const sign = async (claims, header = { alg: "RS256", kid }) => {
    const head = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;
    const sig = await webcrypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, new TextEncoder().encode(head));
    return `${head}.${b64url(new Uint8Array(sig))}`;
  };
  return { jwk, sign };
}

test("Access verification", async (t) => {
  const real = await makeSigner("k1");
  const forger = await makeSigner("k1"); // same key id, different key
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.equal(String(url), `https://${TEAM}/cdn-cgi/access/certs`);
    return new Response(JSON.stringify({ keys: [real.jwk] }));
  };
  t.after(() => (globalThis.fetch = realFetch));

  const env = { ACCESS_TEAM_DOMAIN: TEAM, ACCESS_AUD: AUD };
  const exp = Math.floor(Date.now() / 1000) + 600;
  const good = { iss: `https://${TEAM}`, aud: [AUD], exp, email: "ryanbwatt@gmail.com" };
  const req = (token) =>
    new Request("https://ryanbwatt.com/admin", token ? { headers: { "cf-access-jwt-assertion": token } } : {});

  assert.deepEqual(await verifyAccess(req(await real.sign(good)), env), { ok: true, email: "ryanbwatt@gmail.com" });

  // The cookie works too.
  const viaCookie = new Request("https://ryanbwatt.com/admin", {
    headers: { cookie: `a=b; CF_Authorization=${await real.sign(good)}` },
  });
  assert.equal((await verifyAccess(viaCookie, env)).ok, true);

  const refused = async (request, e = env) => {
    const r = await verifyAccess(request, e);
    assert.equal(r.ok, false, JSON.stringify(r));
    return r.reason;
  };

  assert.match(await refused(req()), /no Access token/);
  assert.match(await refused(req(await real.sign(good)), {}), /ACCESS_TEAM_DOMAIN/);
  assert.match(await refused(req(await real.sign(good)), { ACCESS_TEAM_DOMAIN: TEAM }), /ACCESS_AUD/);
  assert.match(await refused(req(await forger.sign(good))), /signature/);
  assert.match(await refused(req(await real.sign({ ...good, exp: exp - 3600 }))), /expired/);
  assert.match(await refused(req(await real.sign({ ...good, aud: ["other"] }))), /another application/);
  assert.match(await refused(req(await real.sign({ ...good, iss: "https://evil.example" }))), /another team/);
  assert.match(await refused(req(await real.sign(good, { alg: "none", kid: "k1" }))), /algorithm/);
  assert.match(await refused(req("garbage")), /malformed/);
  assert.match(
    await refused(req(await real.sign(good)), { ...env, ADMIN_EMAIL: "someone@else.com" }),
    /admin address/,
  );
  assert.equal((await verifyAccess(req(await real.sign(good)), { ...env, ADMIN_EMAIL: "RyanBWatt@gmail.com" })).ok, true);
});

test("team domain accepts the short or full form", () => {
  assert.equal(teamHost("ryanbwatt"), "ryanbwatt.cloudflareaccess.com");
  assert.equal(teamHost("https://ryanbwatt.cloudflareaccess.com/"), "ryanbwatt.cloudflareaccess.com");
  assert.equal(teamHost(""), "");
});

test("every name but ryanwatt.ca redirects there, keeping path and query", () => {
  assert.equal(canonicalRedirect("https://ryanwatt.ca/about"), null);
  assert.equal(canonicalRedirect("https://ryanbwatt.com/about?via=joe"), "https://ryanwatt.ca/about?via=joe");
  assert.equal(canonicalRedirect("http://www.ryanwatt.ca/"), "https://ryanwatt.ca/");
  assert.equal(canonicalRedirect("https://www.ryanbwatt.com/photos"), "https://ryanwatt.ca/photos");
  assert.equal(canonicalRedirect("https://abc123.ryanbwatt-com.pages.dev/about"), null);
  assert.equal(canonicalRedirect("http://localhost:4321/about"), null);
});

// --- The likely-people view, run against a real SQLite database through a
// minimal stand-in for the D1 API.

function fakeD1() {
  const sql = new DatabaseSync(":memory:");
  const stmt = (text, args = []) => ({
    bind: (...a) => stmt(text, a),
    all: async () => ({ results: sql.prepare(text).all(...args) }),
    first: async () => sql.prepare(text).get(...args) ?? null,
    run: async () => sql.prepare(text).run(...args),
  });
  return {
    sql,
    prepare: (text) => stmt(text),
    batch: async (list) => Promise.all(list.map((s) => s.run())),
  };
}

test("likely people drops cloud networks and one-hit homepage visits", async () => {
  const db = fakeD1();
  const now = Date.UTC(2026, 10, 23, 17, 0);
  await loadReport(db, { days: 1, bots: false }, now); // creates the schema
  const day = dayOf(now);
  const add = (visitor, path, extra = {}) =>
    db.sql
      .prepare(
        `INSERT INTO visits (site, ts, day, path, referrer, via, asn, network, bot, visitor)
         VALUES ('ryanwatt.ca', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(now, day, path, extra.referrer ?? null, extra.via ?? null, extra.asn ?? 7922,
        extra.network ?? "Comcast Cable", extra.bot ?? 0, visitor);

  add("reader", "/");               // homepage, then a second page: a person
  add("reader", "/experience");
  add("aws", "/experience", { asn: 16509, network: "Amazon.com, Inc." });
  add("smallhost", "/", { asn: 99999, network: "Some VPS Hosting Ltd" });
  add("onehit", "/");               // one homepage view, nothing else
  add("linked", "/", { referrer: "linkedin.com" }); // one view, but came from somewhere
  add("tagged", "/", { via: "joe" });
  add("relay", "/photos", { asn: 13335, network: "Cloudflare, Inc." }); // Private Relay stays
  add("crawler", "/", { bot: 1 });

  const people = await loadReport(db, { days: 1, bots: false }, now);
  assert.equal(people.totals.visitors, 7);
  assert.equal(people.totals.likely_visitors, 4); // reader, linked, tagged, relay
  assert.equal(people.totals.cloud_visitors, 2);
  assert.equal(people.totals.one_hit_visitors, 1);

  const likely = await loadReport(db, { days: 1, bots: false, likely: true }, now);
  assert.equal(likely.daily[0].visitors, 4);
  assert.ok(!likely.recent.some((r) => r.network === "Amazon.com, Inc."));
  assert.equal(likely.sites[0].likely, 4);

  const html = renderReport(likely, "me@example.com");
  assert.match(html, /<b>Likely people<\/b> · <a href="\/admin\?days=1">People<\/a>/);
});
