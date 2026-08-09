import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * One collection: `pages`.
 *
 * Pages, not posts. No dates, no tags, no drafts, no pagination — a page is
 * a durable thing revised in place, not an entry filed under a month.
 * Adding src/content/pages/whatever.md creates /whatever and puts it in the
 * nav. There is no second place to register it.
 */
const pages = defineCollection({
  loader: glob({ base: "./src/content/pages", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    /** Nav label and <title>. Not rendered as a heading on the page. */
    title: z.string(),

    /** Set false to publish a page that isn't listed in the nav. */
    nav: z.boolean().default(true),

    /** Lower sorts first. Omit and it sorts alphabetically. */
    order: z.number().optional(),

    /** Optional meta description. Nothing is generated if it's absent. */
    description: z.string().optional(),
  }),
});

export const collections = { pages };
