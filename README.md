# ryanbwatt.com

A personal site built as a set of standing pages rather than a blog.
Live at **[ryanbwatt.com](https://ryanbwatt.com)**.

| | |
| --- | --- |
| Homepage HTML | 1,688 bytes |
| Stylesheet | 9,063 bytes, hand-written, served unbundled |
| Markup, styles and script | 30 KB across 7 pages |
| Photographs | 7 MB, lazy-loaded on the Photos page |
| JavaScript | No framework, no bundle. Two hand-written scripts: the homepage intro gate and the Photos lightbox |
| Web fonts | none |
| Runtime dependencies | 1 |
| Requests per text page | 2 |

The reasoning behind all of this, including the parts that reversed earlier
decisions, is in [DECISIONS.md](DECISIONS.md).

## What this is

A deliberate reconstruction of [patrickcollison.com](https://patrickcollison.com)
— not an homage to its restraint, but a copy of its actual construction.

His site is not minimally designed. It is *undesigned*: a page from the mid
2000s that was never revisited. 13px Helvetica on white. Default-blue
underlined links. A nav floated into a narrow column at the top right. Text in
a fixed 500px column, set 200px in from the left. Nothing centred, nothing
responsive, and most of the window simply empty. His homepage's content div
contains nothing at all.

That last part is the hardest thing to copy and the most important: the
homepage here is a name and a list of links, and nothing else.

The structure follows from it. Pages, not posts — no dates, no feed, no
posting cadence to fall behind on.

## Adding a page

Drop a Markdown file in `src/content/pages/`. The filename becomes the URL and
the nav link appears on the next build.

```
src/content/pages/fast.md   ->   /fast
```

```markdown
---
title: Fast
---

Content goes here.
```

Pages don't render an `<h1>` — the title lives in `<title>` and the nav, and
repeating it above the text is a template habit. Add your own `##` headings
inside the Markdown where a page needs them.

| Field | |
| --- | --- |
| `title` | Required. Nav label and page title. |
| `nav` | `false` publishes the page without listing it. |
| `order` | Lower sorts first. Omit for alphabetical. |
| `description` | Optional meta description. |

## Changing the look

`public/style.css`. 379 lines, hand-written, literal values, no
variables. It is served to the browser byte for byte as it appears in the
repo — no bundler touches it.

Before adding anything, read the list of removed things in `AGENTS.md`. Most
visual "improvements" — centring the column, adding descriptions under the nav
links, dividers between rows, a heading above each page — are precisely what
makes a site look like it came out of a builder.

Contrast, if you change a colour: `#333` on white is 12.63:1 and `#0864c7` on
white is 5.74:1. Stay above 4.5:1.

## Commands

```
npm install
npm run dev        # localhost:4321
npm run verify     # type check + build
npm run build      # static output to dist/
```

## Deployment

Cloudflare Pages, connected to `main`.

- Framework preset: **Astro**
- Build command: `npm run build`
- Output directory: `dist`

If a merge to `main` doesn't deploy, check that the Cloudflare Workers and Pages
GitHub app still has access to this repository (GitHub → Settings →
Applications → Configure → Repository access).

## Stack

Astro, and nothing else. No integrations, no webfonts, no CSS framework, no
JavaScript framework or bundle, no cookies, no favicon.

The repository ships no analytics and requests nothing from a third party.
Cloudflare, which hosts the site, adds two things at the edge that are not in
this repo: its Web Analytics beacon, and an email-obfuscation script on pages
with a `mailto:` link.

## Repository

| | |
| --- | --- |
| `src/content/pages/` | The site's content. One Markdown file per page. |
| `public/style.css` | The entire stylesheet. Served exactly as written. |
| `public/gallery.js` | The Photos lightbox. Served exactly as written. |
| `src/layouts/Base.astro` | The only layout. Head, nav, and the content column. |
| `src/pages/[...slug].astro` | Renders every content page. |
| `src/lib/pages.ts` | Nav ordering. |
| `AGENTS.md` | Working rules — read before changing the design. |
| `DECISIONS.md` | Why it's built this way, and what wasn't built. |
