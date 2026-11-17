import type { APIRoute } from "astro";
import { allPages } from "../lib/pages";

// Every content page plus Art Expert. Hand-rolled rather than an integration:
// the site has none, and this is twenty lines.
export const GET: APIRoute = async ({ site }) => {
  const base = (site?.toString() ?? "https://ryanwatt.ca/").replace(/\/$/, "");
  const paths = [...(await allPages()).map((p) => `/${p.id}`), "/art-expert"];
  const urls = paths.map((p) => `  <url><loc>${base}${p}</loc></url>`).join("\n");
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { "Content-Type": "application/xml" } });
};
