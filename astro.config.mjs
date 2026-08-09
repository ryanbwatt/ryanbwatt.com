// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://ryanbwatt.com",
  integrations: [sitemap()],
  // Markdown uses Astro 7's default `satteri` processor, which already applies
  // smart punctuation (curly quotes, em dashes, ellipses). Nothing to configure.
  build: {
    // /about rather than /about/ — matches the flat, filename-is-the-URL model.
    format: "file",
  },
});
