// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://ryanbwatt.com",

  // No integrations. Astro's only job here is turning Markdown into HTML.

  // The floating dev toolbar is the only thing on screen that looks like a
  // 2020s web app. It never shipped to production anyway; this just keeps
  // the local view honest.
  devToolbar: { enabled: false },

  build: {
    // /about rather than /about/ — the filename is the URL.
    format: "file",
  },
});
