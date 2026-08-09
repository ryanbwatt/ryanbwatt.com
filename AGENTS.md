# ryanbwatt.com

Personal site. Astro, static output, no JavaScript shipped to the browser.

## The two rules

**1. Pages, not posts.** This is a commonplace book, not a blog. There are no
dates, no feed, no tags, no pagination, and no drafts workflow — all removed on
purpose. A page is a durable thing revised in place over years. Do not add
blog machinery, even if it seems like an obvious improvement. If a page needs a
"last revised" note, that's the optional `updated` frontmatter field.

**2. Only `tokens.css` names a value.** Every colour, typeface, size, and
spacing unit lives in `src/styles/tokens.css` as a custom property. No other
file may contain a literal hex code, font name, or spacing number. This exists
so the design can be rethemed by editing one file — that is the point of the
whole build, and it degrades the moment a stray `#333` lands in a component.

Hairline borders (`1px`) and `0`/`100%` are the only literals allowed elsewhere.

## Adding a page

Create `src/content/pages/<slug>.md`. The filename becomes the URL, and the
homepage link appears automatically. There is nothing else to register.

```markdown
---
title: Fast
blurb: Ambitious things, built quickly.
---

Content here.
```

Frontmatter: `title` (required), `blurb`, `nav` (set `false` to publish
unlisted), `order` (lower sorts first; otherwise alphabetical), `updated`,
`description` (defaults to `blurb` for meta tags).

## Changing the design

Edit `src/styles/tokens.css`. Accent colour, typeface, column width, and
vertical rhythm are each a single line. Dark mode re-points the same tokens in
one `@media` block; delete that block to drop dark mode entirely.

After any colour change run `npm run contrast` — it parses the tokens and
fails if anything drops below WCAG AA (4.5:1). `--ink-mute` is the one that
regresses easily, since it's used at small sizes.

To change the typeface: install a new `@fontsource-variable/*` package, swap
the two `@import`s at the top of `src/styles/base.css`, and update
`--font-body`.

## Commands

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server on :4321 |
| `npm run verify` | Type check, contrast gate, production build |
| `npm run contrast` | WCAG AA check on the colour tokens |
| `npm run build` | Static build to `dist/` |

Run `npm run verify` before pushing.

## Deployment

Cloudflare Pages, building from `main`. Build command `npm run build`, output
directory `dist`.

## Documentation

- [Content collections](https://docs.astro.build/en/guides/content-collections/)
- [Routing](https://docs.astro.build/en/guides/routing/)
- [Astro components](https://docs.astro.build/en/basics/astro-components/)
