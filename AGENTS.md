# ryanwatt.ca

Personal site. Astro turns Markdown into static HTML and does nothing else.

## The three rules

**1. Pages, not posts.** A commonplace book, not a blog. No dates, no feed, no
tags, no pagination, no drafts workflow — all absent on purpose. A page is a
durable thing revised in place. Do not add blog machinery.

**2. The site must not look designed.** It is a deliberate reconstruction of
patrickcollison.com: 13px Helvetica on white, blue underlined links, nav in a
narrow column at the top right, text in a fixed 500px column set 200px in from
the left, and most of the page empty. Nothing is centred. Nothing scales to
fill the window. There are no rules, cards, shadows, gradients, or accents.

The things that make a page look template-built, all of which were removed and
none of which should come back:

- centred content, or `max-width` containers that fill the viewport
- descriptions or blurbs beside nav links
- hairline rules between list items
- an intro paragraph or hero on the homepage (it shows the About page as is)
- fluid `clamp()` typography, or any type scale
- webfonts, CSS variables, dark mode, `text-wrap`, `color-mix`
- an `<h1>` echoing the page title above the text

**3. The stylesheet is hand-written and served raw.** `public/style.css` goes
to the browser exactly as typed — no bundler, no hashing, no minification. It
has literal values and no variables. Keep it short enough to read in one pass.

## Adding a page

Create `src/content/pages/<slug>.md`. The filename is the URL and the nav link
appears automatically.

```markdown
---
title: Fast
---

Content here. No leading heading — the title is in <title> and the nav.
```

Frontmatter: `title` (required), `nav` (`false` to publish unlisted), `order`
(lower sorts first; otherwise alphabetical), `description` (meta only).

Current nav order is explicit, not alphabetical: About (1), Experience (2),
Favorites (3), Photos (4), Contact (5, hidden), Projects (6), Athletic Resume (7,
at `/athletics`), Writing (8, hidden until an essay is published; it stays last
when shown). About also carries the contact details, below the intro. The
homepage renders the About page (no intro gate since Nov 2026), with About
marked current in the nav. The "Ryan Watt" title is plain text, not a link.
Colophon was removed. Interests was folded into About; Goals was removed.

## Layout grid

Every page hangs off the same two numbers. The left edge is **200px** — the
text column, the About headshot, and the photo grid all begin there. Content
starts **150px down** from the top, level with where the nav column ends, not at
the very edge (`#content` and `#gallery`). On the gallery the drop is
`padding-top`, not `margin-top`: the grid is the first in-flow child there, and
a top margin would collapse through `<body>` and pull the floated nav down with
it.

Anything laid across the page follows an odd-column model (7 / 5 / 3 / 1):
divide the width from the 200px edge into an odd number of equal columns with a
fixed **20px gutter**, and place nothing off a column's left edge. The photo
grid is the worked example — 3 columns, 20px gutter.

## Images

Put them in `public/` and reference them with a raw `<img>` in the Markdown,
with explicit `width` and `height` so nothing shifts as the page loads:

```html
<img src="/headshot.jpg" width="128" height="130" alt="Ryan Watt" />
```

Resize before committing — source photos are megabytes and this site's
homepage is under 2 KB. Roughly 2× the display size is right for retina:

```
sips -Z 260 -s format jpeg -s formatOptions 82 in.jpg --out public/out.jpg
```

Re-encoding also drops EXIF, which matters: phone photos can carry GPS.

## Photos gallery

The Photos page sets `gallery: true` and is a grid of thumbnails, **three
across**, newest first, on the layout grid above. Each photo is a `<figure>`:

```html
<figure>
  <img src="/photos/thumbs/p18.jpg" data-full="/photos/p18.jpg" width="500" height="333" loading="lazy" alt="Vancouver" />
  <figcaption>Vancouver, July 2026</figcaption>
</figure>
```

The full-size image lives at `public/photos/` and the grid thumbnail at
`public/photos/thumbs/` (≈500px wide). The full URL sits in `data-full`, not a
wrapping `<a href>`: `public/gallery.js` (served raw, like the stylesheet) reads
it to build the lightbox, where the caption — `Location, Month Year`, hidden in
the grid — shows tight under the enlarged photo. There's no plain link to the
full image, and gallery.js also swallows right-click and drag on the photos, so
the one-click save is off. That only deters casual saving: the files are still
served and a screenshot always works — real protection isn't possible on a
static host. To add a photo: resize the original to both sizes, drop a
`<figure>` at the top of the list, done.

```
sips -Z 1440 -s format jpeg -s formatOptions 80 in.jpg --out public/photos/pNN.jpg
sips -Z 500  -s format jpeg -s formatOptions 80 in.jpg --out public/photos/thumbs/pNN.jpg
```

## Commands

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server on :4321 |
| `npm run verify` | Type check, tests, then production build |
| `npm test` | Tests for the visit logging in `analytics/` |
| `npm run build` | Static build to `dist/` |

Run `npm run verify` before pushing.

## Colour contrast

There is no automated gate — the palette is three literals and rarely moves.
Current: `#333` on `#fff` is 12.63:1, `#0864c7` on `#fff` is 5.74:1. Both clear
WCAG AA. If you change a colour, check it stays above 4.5:1.

## Visit logging

`functions/_middleware.js` logs each page view to D1 after the page is served;
`functions/admin.js` is the private report. The logic lives in `analytics/`
with tests (`npm test`). Rules:

- Nothing analytics-related goes into the pages, `Base.astro`, or `public/`
  (other than `_routes.json`). No beacon, no cookie, no client script.
- The middleware must return the built response untouched and must never
  throw; a failed write is swallowed.
- Never store the IP address. Everything rendered on `/admin` is escaped.
- A new image or asset path at the top level of `public/` should be added to
  the `exclude` list in `public/_routes.json`.
- `analytics/log.js` is shared with the `ryanbwatt/art-moves` repository, which
  writes to the same database under its own `site` label. Keep the two copies
  identical. Schema changes may only add columns.
- `/admin` is not a site page: it has its own inline styles and is not in the
  nav.
- `/admin?likely=1` is the "likely people" view: it also drops cloud and
  hosting networks (`CLOUD_ASNS` in `analytics/report.js`) and one-hit homepage
  visits with no referrer or tag. It is computed at read time, so changing the
  list re-counts history and `log.js` is untouched.

## Deployment

Cloudflare Pages from `main`. Build `npm run build`, output `dist`.
