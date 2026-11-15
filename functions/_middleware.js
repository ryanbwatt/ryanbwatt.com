// Runs in front of every page on Cloudflare Pages. It serves the page exactly
// as built, then records the visit in the background (see analytics/log.js).
// Static assets are excluded in public/_routes.json and never reach this.
//
// The site lives at ryanwatt.ca. Its earlier address, ryanbwatt.com, and the
// www name are still attached to this project so old links keep working: a
// request on any other name is sent to the same path on ryanwatt.ca before
// anything else happens. Preview deployments (*.pages.dev) and local dev are
// left alone. See DECISIONS.md, decision 9.
//
// If the D1 binding `DB` is missing, or the write fails, the visitor gets the
// same page either way: logging can never break the site.

import { logVisit, shouldLog } from "../analytics/log.js";

const SITE = "ryanwatt.ca";

// Hostnames that answer directly rather than redirecting to SITE.
function servesDirectly(hostname) {
  return (
    hostname === SITE ||
    hostname.endsWith(".pages.dev") ||
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  );
}

export function canonicalRedirect(requestUrl) {
  const url = new URL(requestUrl);
  if (servesDirectly(url.hostname)) return null;
  return `https://${SITE}${url.pathname}${url.search}`;
}

export async function onRequest(context) {
  const target = canonicalRedirect(context.request.url);
  if (target) return Response.redirect(target, 301);

  const response = await context.next();
  try {
    if (context.env.DB && shouldLog(context.request, response)) {
      context.waitUntil(logVisit(context.env.DB, context.request, SITE).catch(() => {}));
    }
  } catch {
    // Never let logging affect the response.
  }
  return response;
}
