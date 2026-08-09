---
title: Colophon
blurb: How this site is built.
order: 99
---

This site is deliberately plain. It's a set of pages rather than a blog —
there are no dates, no feed, and nothing that implies I post on a schedule.
A page here is something I expect to revise for years, not an entry filed
under a month.

The structure borrows from [patrickcollison.com](https://patrickcollison.com),
which treats a personal site as a commonplace book: a flat list of standing
pages, each one a topic rather than an occasion.

The look borrows from two galleries.
[David Zwirner](https://www.davidzwirner.com) sets soft charcoal type on an
off-white ground — no pure black, no pure white — which is most of why the
page feels quiet. [Sprüth Magers](https://spruethmagers.com) runs a single
accent colour across an otherwise monochrome site, so changing the site's
mood is a one-value decision.

Underneath, every colour, typeface, and measurement in the design lives in a
single file of CSS variables. Nothing else names a value. Changing the accent,
the typeface, or the width of the column edits one line — which is the point,
since I expect to change my mind.

There is no webfont. The page renders in whatever sans-serif your computer
already has — Helvetica, most likely. This is the least fashionable choice
available and the reason the site doesn't look like it came out of a builder:
every template downloads a typeface, and this one downloads nothing.

Built with [Astro](https://astro.build). Text is Markdown in a Git repository.
Hosted on Cloudflare Pages. No analytics, no cookies, no tracking, and no
JavaScript at all.
