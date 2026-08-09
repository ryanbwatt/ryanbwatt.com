import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * One collection: `pages`.
 *
 * This site is pages, not posts. There is no date, no draft workflow, no
 * tags, and no pagination — deliberately. A page is a durable thing you
 * revise in place over years, the way patrickcollison.com works. Adding
 * `src/content/pages/whatever.md` creates `/whatever` and, unless you opt
 * out, its link on the homepage. There is no second place to register it.
 */
const pages = defineCollection({
  loader: glob({ base: "./src/content/pages", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    /** Shown as the page's <h1>, its nav label, and its <title>. */
    title: z.string(),

    /** One line on the homepage, under the link. Optional. */
    blurb: z.string().optional(),

    /** Set false to publish a page that isn't listed on the homepage. */
    nav: z.boolean().default(true),

    /**
     * Homepage ordering. Lower sorts first; pages without one fall to the
     * bottom in alphabetical order. Leave it off unless you care.
     */
    order: z.number().optional(),

    /**
     * Optional "last revised" note. Only worth setting on pages where
     * staleness would actually mislead a reader.
     */
    updated: z.coerce.date().optional(),

    /** Overrides the meta description, which defaults to `blurb`. */
    description: z.string().optional(),
  }),
});

export const collections = { pages };
