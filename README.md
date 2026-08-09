# ryanbwatt.com

A personal site built as a set of standing pages rather than a blog.

## Why it's built this way

The structure follows [patrickcollison.com](https://patrickcollison.com): a
flat list of pages, each one a topic rather than an occasion. No dates, no
feed, no posting cadence to fall behind on. A page is something you revise for
years.

The visual language borrows from two galleries —
[David Zwirner](https://www.davidzwirner.com) for the off-white ground and soft
charcoal type (no pure black, no pure white), and
[Sprüth Magers](https://spruethmagers.com) for running a single accent colour
across an otherwise monochrome site.

Underneath, one file — `src/styles/tokens.css` — holds every colour, typeface,
and measurement as a CSS custom property. Nothing else in the codebase names a
value. Changing the accent, the typeface, or the column width is a one-line
edit, which is deliberate: the design is meant to be revisited, and revisiting
it should never cost a refactor.

## Adding a page

Drop a Markdown file in `src/content/pages/`. The filename becomes the URL and
the homepage link appears on the next build.

```
src/content/pages/fast.md   ->   /fast
```

```markdown
---
title: Fast
blurb: Ambitious things, built quickly.
---

Content goes here.
```

| Field | |
| --- | --- |
| `title` | Required. Used as the `<h1>`, the nav label, and the page title. |
| `blurb` | One line under the homepage link. Also the default meta description. |
| `nav` | `false` publishes the page without listing it on the homepage. |
| `order` | Lower sorts first. Omit and it sorts alphabetically. |
| `updated` | Optional "last revised" stamp. Only worth setting where staleness would mislead. |
| `description` | Overrides the meta description. |

## Changing the look

Everything lives in `src/styles/tokens.css`:

```css
--accent:    #c1440e;   /* links */
--font-body: "Figtree Variable", …;
--measure:   36rem;     /* prose column */
--rhythm:    1.6rem;    /* vertical spacing unit */
```

Dark mode re-points those same tokens inside one `@media` block. Delete the
block if you don't want it; nothing else has to change.

Run `npm run contrast` after any colour change — it reads the tokens and fails
if a foreground drops below WCAG AA against its background.

The current palette and typeface are a **placeholder**, not a decision. Figtree
stands in for Avenir Next, which Zwirner licenses commercially.

## Commands

```
npm install
npm run dev        # localhost:4321
npm run verify     # type check + contrast gate + build
npm run build      # static output to dist/
```

## Deployment

Cloudflare Pages, connected to `main`.

- Framework preset: **Astro**
- Build command: `npm run build`
- Output directory: `dist`

## Stack

Astro 7 · Markdown content collections · self-hosted
[Figtree](https://fonts.google.com/specimen/Figtree) · no JavaScript, no
analytics, no cookies.
