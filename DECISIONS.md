# Decisions

Why this site is built the way it is. Written down because the reasoning is
the part that doesn't survive in the code, and because two of these decisions
reversed earlier ones.

## At a glance

| | |
| --- | --- |
| Homepage HTML | 1,688 bytes |
| Stylesheet | 9,063 bytes (379 lines, hand-written) |
| Markup, styles and script | 30 KB across 7 pages |
| Photographs | 7 MB, lazy-loaded on the Photos page |
| JavaScript shipped | No framework, no bundle. Two hand-written scripts (see 10) |
| Web fonts | none |
| Runtime dependencies | 1 (Astro) |
| Requests to render a text page | 2 — the HTML and the stylesheet |
| Third-party services in the repo | none. Cloudflare adds email obfuscation at the edge |
| Visit logging | Server-side, at the edge. Nothing added to the pages (see 11) |

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
no CSS framework, no component library. (The "no database, no analytics" part
was later reversed for visit logging — see 11. The pages themselves are
unchanged by it.)

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

**Decision.** One 379-line stylesheet with literal values, at
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

**Context.** Astro 7.4 requires Node ≥ 22.23.4. Cloudflare Pages defaults lower.

**Decision.** `.node-version` pinning 22.23.5.

**Consequence.** Caught before the first deploy rather than after. Without it
the build fails at install with an error that doesn't name the cause.

## 9. One address, and the old one redirects in the middleware

**Context.** The site launched at `ryanbwatt.com`, with `ryanwatt.ca` redirecting
to it through a Redirect Rule on the `.ca` zone and two placeholder AAAA
records. In November 2026 the two swapped: `ryanwatt.ca` is the address and
`ryanbwatt.com` is the one that redirects.

**Decision.** All three names (`ryanwatt.ca`, `www.ryanwatt.ca`,
`ryanbwatt.com`) are custom domains on the same Pages project. A few lines at
the top of `functions/_middleware.js` send any request that is not on
`ryanwatt.ca` to the same path there with a 301. The Redirect Rule and the
placeholder records on the `.ca` zone are gone.

**Consequence.** The redirect now lives in the repository instead of in a
dashboard, so it is versioned and tested with everything else. Paths and query
strings carry over, so `ryanbwatt.com/about?via=joe` lands on
`ryanwatt.ca/about?via=joe`. Static assets listed in `public/_routes.json`
never reach the middleware and still answer on the old name, which is harmless.
Rows already in the visit log keep the `ryanbwatt.com` label they were written
with; new rows are labelled `ryanwatt.ca`. The GitHub repository and the Pages
project keep their original names (`ryanbwatt.com`, `ryanbwatt-com`): renaming
them changes nothing a visitor sees and risks the deploy hook.

## 10. Two scripts, both hand-written

**Context.** The site began with no JavaScript at all. Two features needed
some: the intro gate on the homepage, and a lightbox on Photos.

**Decision.** Write both by hand and serve them as typed. The gate is a few
inline lines in the layout, on the homepage only. The lightbox is
`public/gallery.js`, loaded on the Photos page only. No framework, no bundler,
no dependency.

**Consequence.** The text pages still ship no script. With JavaScript off the
gate never shows and the homepage is what you get; the photo grid still
renders, without the enlarged view. The cost is that "no JavaScript" is no
longer a claim this site can make, and the numbers at the top of this file say
so.

## 11. Count visits at the edge, not in the page

**Context.** Decision 2 said no analytics and no database. Then I wanted to
know whether anyone reads the site, and specifically whether a link I sent
someone was opened. The usual answer is a tracking script, which would put a
third-party request and a cookie banner's worth of questions on a site whose
text pages ship no script at all.

**Decision.** Log visits on the server. A Pages Function
(`functions/_middleware.js`) serves each page exactly as built, then writes one
row to a Cloudflare D1 database in the background. `/admin` reads that table
back as plain HTML tables and is locked behind Cloudflare Access.

**Consequence.** The pages are byte for byte what they were: no script, no
cookie, no extra request, nothing for an ad blocker to block. The numbers at
the top of this file still hold. What it costs:

- "No database, no analytics" is no longer true, and this file says so.
- There is now code in the repo that isn't the site: `analytics/` and
  `functions/`, plus a small test file.
- It records more than a page counter would. Each row has the page, the
  referring site's hostname, city and country, device type, and the name of the
  network the visitor is on — a company name from an office, an internet
  provider from a home or phone. That is as close to "who" as a website can
  honestly get; it never names a person.
- IP addresses are not stored. Unique visitors are counted with a hash of
  IP and user agent, salted with a random value that is replaced every day and
  then deleted, so yesterday's ids can't be tied back to an address even with
  the database in hand. The cost is that a returning visitor looks new each
  day.
- A link with `?via=name` on the end records the name. That is how a visit
  gets tied to a person: by me labelling the link before I send it.
- Bots are separated by user agent only. One pretending to be Chrome counts as
  a person.

---

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
