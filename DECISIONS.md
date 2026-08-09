# Decisions

Why this site is built the way it is, including the things I chose not to
build. Written down because the reasoning is the part that doesn't survive in
the code, and because two of these decisions reversed earlier ones.

## At a glance

| | |
| --- | --- |
| Homepage HTML | 547 bytes |
| Stylesheet | 2,523 bytes (138 lines, hand-written) |
| Whole site | 68 KB, 7 pages |
| JavaScript shipped | none |
| Web fonts | none |
| Runtime dependencies | 1 (Astro) |
| Requests to render a page | 2 — the HTML and the stylesheet |
| Third-party services in the page | none |

---

## 1. Pages, not posts

**Context.** The obvious default for a personal site is a blog. I didn't want
one — I'm not going to post weekly, and a blog with a three-month gap advertises
that.

**Decision.** One content collection of standing pages. No dates, no feed, no
tags, no pagination, no drafts workflow.

**Consequence.** A page is something I revise in place over years rather than an
entry filed under a month. Nothing on the site implies a cadence, so nothing
goes stale by not being updated. Adding `src/content/pages/x.md` creates `/x`
and its nav link with no second place to register it.

## 2. Astro, and nothing else

**Context.** The site is static text. Almost any framework would work.

**Decision.** Astro with zero integrations. No CMS, no database, no analytics,
no CSS framework, no component library.

**Consequence.** One runtime dependency. Astro's only job is turning Markdown
into HTML; if it were removed tomorrow the content is still plain Markdown in
a Git repository. Editing is `git commit`, which is where I already work.

I briefly had `@astrojs/sitemap` installed and removed it: seven pages, all
linked from the homepage, don't need a sitemap to be crawled.

## 3. Reconstruct the reference, don't reinterpret it

**Context.** This is the decision I got wrong twice. I wanted the restraint of
[patrickcollison.com](https://patrickcollison.com), and twice built something
tasteful and modern — soft off-white ground, generous whitespace, fluid type,
a single accent colour. Both times it still read as a website builder.

**Decision.** Copy how the reference is actually *constructed*, not how it
feels.

**Consequence.** The diagnosis was measurable. My homepage was 13,800 bytes of
HTML against his 1,391, with 60 CSS-variable references, four `clamp()` calls
and a dark-mode block against his zero of each. His site isn't minimally
designed, it's *undesigned* — a mid-2000s page nobody revisited. Restraint
still looks like decisions were made; absence doesn't.

So: centred layout, nav blurbs, dividers, the homepage intro paragraph, fluid
type and the accent colour all came out. Floats and fixed pixel widths went in.
The homepage's content div is empty, which is the hardest part to copy and the
most important.

## 4. No web font

**Context.** I'd self-hosted a variable font as an Avenir stand-in.

**Decision.** Ship no font file at all. `font-family` is a plain system stack.

**Consequence.** This is the single biggest reason the site doesn't read as
template-built. Every site builder downloads a Google font; not downloading one
is the tell. It also removes two network requests and any flash of fallback
text. Deliberately no `system-ui` in the stack — that resolves to SF Pro on
macOS and makes a page look like an app rather than a document.

## 5. Hand-written CSS, served raw, with no variables

**Context.** I'd built a design-token layer — a dozen CSS custom properties
that everything else referenced — so the whole look could be re-themed from one
file. It worked, and I deleted it.

**Decision.** One 138-line stylesheet with literal values, at
`public/style.css`, served byte for byte as typed. No bundler, no hashing, no
minification, no variables, no dark mode.

**Consequence.** Retheming is now find-and-replace instead of a one-line edit —
a real cost, accepted because a variable layer and a dark-mode block are
themselves modern-framework tells, and because a palette of three colours
doesn't need indirection. The file you edit is literally the file that ships,
which makes the whole stylesheet readable in one pass.

I dropped the automated WCAG contrast gate with it. Three literal colours that
rarely move don't justify a build step; the current ratios are recorded in
`AGENTS.md` (12.63:1 for text, 5.74:1 for links) and checked by hand on change.

## 6. Floats and fixed pixel widths

**Context.** Modern layout would be flexbox or grid with fluid widths.

**Decision.** `float`, fixed `px` columns, nothing centred, nothing scaling to
fill the window.

**Consequence.** Period-correct and part of the effect. One deliberate
exception: a single `max-width: 720px` block stacks the columns on phones. The
layout being copied predates phones and is genuinely unusable on one, and I'd
rather the site work than be pure.

## 7. No `<h1>` echoing the page title

**Context.** Templates put the page name in a heading above the text.

**Decision.** Content pages start with a paragraph. The title lives in
`<title>` and the nav.

**Consequence.** Matches the reference and removes a redundancy nobody needs
read twice. Markdown can still declare its own headings where a page earns
them.

## 8. Pin the Node version

**Context.** Astro 7 requires Node ≥ 22.12. Cloudflare Pages defaults lower.

**Decision.** `.node-version` pinning 22.16.0.

**Consequence.** Caught before the first deploy rather than after. Without it
the build fails at install with an error that doesn't name the cause.

## 9. Redirect the second domain at the edge

**Context.** `ryanwatt.ca` should reach the same site without duplicating it.

**Decision.** A 301 Redirect Rule on the `.ca` zone, plus two **proxied AAAA
records pointing at `100::`**.

**Consequence.** The placeholder records look pointless and are load-bearing: a
redirect rule can't fire if DNS never reaches Cloudflare's edge, and `100::` is
the IPv6 discard prefix, so nothing is ever actually sent there. The redirect is
dynamic rather than static, so `ryanwatt.ca/about` lands on `ryanbwatt.com/about`
instead of dumping everyone on the homepage. Verified across apex, `www`, plain
`http`, and query strings.

---

## Deliberately not built

Each of these was considered and rejected as not earning its keep:

| | Why not |
| --- | --- |
| CI workflow running the build | Cloudflare Pages already builds every push. A second runner would duplicate it and tell me the same thing later. |
| Tests | Seven static pages with no logic. `astro check` plus a build is the real gate; a test asserting that Markdown renders would be theatre. |
| A CMS | Content is Markdown in Git, edited where I already work. A CMS would add a service, an auth surface, and a second source of truth. |
| Analytics | I don't have a decision I'd make differently based on the traffic. It's also a third-party script on a site whose point is that it loads nothing. |
| Sitemap / robots.txt | Seven pages, all linked from the homepage. Crawlers manage. |
| Dark mode | Doesn't exist in the reference and is a visible tell for anyone browsing in it. |
| Image pipeline | One image. `sips` resizes it before commit; a build-time optimiser for a single file is a dependency I'd have to maintain. |
| Badges, issue templates, contributing guide | It's a personal site with one contributor. |
| A favicon | The scaffold shipped Astro's own logo, which is the most literal "built with a tool" tell there is. Rather than replace it with a monogram, there's no icon file at all — `/favicon.ico` 404s and the tab stays blank. |

## Known trade-offs

Things I know are worse this way, kept on purpose:

- **Retheming is find-and-replace.** Removing the token layer traded editing
  convenience for authenticity. If the palette starts moving often, that's the
  first decision I'd revisit.
- **No automated accessibility gate.** Contrast is checked by hand against the
  ratios in `AGENTS.md`. Fine at three colours; wrong at ten.
- **The layout is fragile by design.** Floats and fixed widths break in ways
  flexbox wouldn't. The mobile breakpoint is the patch, and it's the one place
  the construction isn't honest to its period.
- **Verification is local.** `npm run verify` before pushing is a convention,
  not something enforced. With one contributor that's a reasonable bet.
