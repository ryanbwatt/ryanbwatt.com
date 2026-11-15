// GET /admin — the visit report. Private: the request must carry a valid
// Cloudflare Access token (analytics/access.js). Everything else gets a
// refusal that shows no data.

import { verifyAccess } from "../analytics/access.js";
import { esc, loadReport, page, parseOptions, renderReport } from "../analytics/report.js";

const HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  "x-robots-tag": "noindex, nofollow",
};

const html = (body, status) => new Response(body, { status, headers: HEADERS });

export async function onRequestGet({ request, env }) {
  const access = await verifyAccess(request, env);
  if (!access.ok) {
    return html(page(`<p>Not available. ${esc(access.reason)}.</p>`, "Not available"), 403);
  }
  if (!env.DB) {
    return html(page(`<p>The D1 database is not bound to this project as <b>DB</b>.</p>`), 503);
  }
  const report = await loadReport(env.DB, parseOptions(new URL(request.url)));
  return html(renderReport(report, access.email), 200);
}
