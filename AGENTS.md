# ryanbwatt.com

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
- an intro paragraph on the homepage (its content div is empty, and stays so)
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

Current nav order is explicit, not alphabetical: About (1), Goals (2),
Experience (3), Interests (4), Contact (5), Colophon (99).

## Images

Put them in `public/` and reference them with a raw `<img>` in the Markdown,
with explicit `width` and `height` so nothing shifts as the page loads:

```html
<img src="/headshot.jpg" width="128" height="130" alt="Ryan Watt" />
```

Resize before committing — source photos are megabytes and this site's
homepage is 420 bytes. Roughly 2× the display size is right for retina:

```
sips -Z 260 -s format jpeg -s formatOptions 82 in.jpg --out public/out.jpg
```

Re-encoding also drops EXIF, which matters: phone photos can carry GPS.

## Commands

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server on :4321 |
| `npm run verify` | Type check, then production build |
| `npm run build` | Static build to `dist/` |

Run `npm run verify` before pushing.

## Colour contrast

There is no automated gate — the palette is three literals and rarely moves.
Current: `#333` on `#fff` is 12.63:1, `#0864c7` on `#fff` is 5.74:1. Both clear
WCAG AA. If you change a colour, check it stays above 4.5:1.

## Deployment

Cloudflare Pages from `main`. Build `npm run build`, output `dist`.
