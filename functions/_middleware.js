// Runs in front of every page on Cloudflare Pages. It serves the page exactly
// as built, then records the visit in the background (see analytics/log.js).
// Static assets are excluded in public/_routes.json and never reach this.
//
// If the D1 binding `DB` is missing, or the write fails, the visitor gets the
// same page either way: logging can never break the site.

import { logVisit, shouldLog } from "../analytics/log.js";

export async function onRequest(context) {
  const response = await context.next();
  try {
    if (context.env.DB && shouldLog(context.request, response)) {
      context.waitUntil(logVisit(context.env.DB, context.request).catch(() => {}));
    }
  } catch {
    // Never let logging affect the response.
  }
  return response;
}
