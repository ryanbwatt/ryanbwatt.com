// Checks that a request to /admin really came through Cloudflare Access.
//
// Access sits in front of ryanbwatt.com/admin and attaches a signed token to
// every request it lets through. Verifying that token here, rather than
// trusting that Access is in the way, matters because the same deployment is
// also reachable at its *.pages.dev address, where Access may not be.
//
// Needs two environment variables on the Pages project:
//   ACCESS_TEAM_DOMAIN  e.g. "ryanbwatt.cloudflareaccess.com"
//   ACCESS_AUD          the Application Audience tag of the Access app
// Optional:
//   ADMIN_EMAIL         if set, only this address is let in
//
// With either required variable missing, every request is refused.

let keyCache = null; // { team, at, keys }

function b64urlBytes(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function b64urlJson(s) {
  return JSON.parse(new TextDecoder().decode(b64urlBytes(s)));
}

export function teamHost(value) {
  const host = String(value || "")
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  if (!host) return "";
  return host.includes(".") ? host : `${host}.cloudflareaccess.com`;
}

async function signingKeys(team) {
  if (keyCache && keyCache.team === team && Date.now() - keyCache.at < 3600_000) {
    return keyCache.keys;
  }
  const res = await fetch(`https://${team}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error("could not fetch Access signing keys");
  const { keys } = await res.json();
  keyCache = { team, at: Date.now(), keys: keys || [] };
  return keyCache.keys;
}

function tokenFrom(request) {
  const header = request.headers.get("cf-access-jwt-assertion");
  if (header) return header;
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  return m ? m[1] : "";
}

// Returns { ok: true, email } or { ok: false, reason }.
export async function verifyAccess(request, env, now = Date.now()) {
  const team = teamHost(env.ACCESS_TEAM_DOMAIN);
  const aud = env.ACCESS_AUD;
  if (!team) return { ok: false, reason: "ACCESS_TEAM_DOMAIN is not set" };
  if (!aud) return { ok: false, reason: "ACCESS_AUD is not set" };

  const token = tokenFrom(request);
  if (!token) return { ok: false, reason: "no Access token on the request" };

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return { ok: false, reason: "malformed token" };
    const header = b64urlJson(parts[0]);
    const claims = b64urlJson(parts[1]);
    if (header.alg !== "RS256") return { ok: false, reason: "unexpected token algorithm" };

    const jwk = (await signingKeys(team)).find((k) => k.kid === header.kid);
    if (!jwk) return { ok: false, reason: "token signed by an unknown key" };

    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      b64urlBytes(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
    if (!valid) return { ok: false, reason: "bad token signature" };

    if (typeof claims.exp !== "number" || claims.exp * 1000 < now) {
      return { ok: false, reason: "token expired" };
    }
    if (claims.iss !== `https://${team}`) return { ok: false, reason: "token from another team" };
    const auds = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!auds.includes(aud)) return { ok: false, reason: "token for another application" };

    const email = String(claims.email || "");
    if (env.ADMIN_EMAIL && email.toLowerCase() !== String(env.ADMIN_EMAIL).toLowerCase()) {
      return { ok: false, reason: "not the admin address" };
    }
    return { ok: true, email };
  } catch {
    return { ok: false, reason: "token could not be verified" };
  }
}
