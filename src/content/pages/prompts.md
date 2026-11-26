---
title: Prompts
nav: false
description: Skills and prompts Ryan Watt uses at work and at the gallery, free to reuse.
---

Written for my own work, with every company-specific value moved into a
config file so they run anywhere.

**[Pulse and one tip](https://github.com/ryanbwatt/account-command-center/blob/main/.claude/skills/pulse-tip/SKILL.md).**
Every Monday, for each account: read usage against contract and the last 60
days of calls, pick the one signal worth raising, match it to a help article,
and draft a four-sentence email. It never sends. Falling usage or an open
escalation goes to me instead of the customer, because that needs a call.
There is also a
[version for Databricks Genie](https://github.com/ryanbwatt/account-command-center/blob/main/docs/databricks-pulse-tip-prompt.md),
so the two can be run side by side and checked against each other.

**[Value delivered](https://github.com/ryanbwatt/account-command-center/blob/main/.claude/skills/value-id/SKILL.md).**
Turns twelve months of measured usage into dollars at published benchmark
rates, lists what the customer pays for and doesn't use, and builds a
customer deck plus an internal companion with the ROI multiple. It never
estimates a missing number; it asks for it.

**[Usage against contract](https://github.com/ryanbwatt/account-command-center/blob/main/.claude/skills/account-audit/SKILL.md).**
Compares contracted commits with actual usage and answers three questions:
upsell, churn risk, and what can't be seen from the data.

**Exhibition press kit.** One brief in, everything a gallery sends out for a
show:

<pre>
You are writing for a contemporary art gallery. From the
exhibition brief below, write:

1. A press release, 400-500 words: headline, dateline, first
   paragraph with artist, title, dates and address; then the
   work, then the artist; end with opening reception and
   contact.
2. A 60-word description for the website and listings.
3. Three social captions under 40 words each. No hashtags,
   no emojis.
4. A short email to collectors who have bought this artist
   before.

Use only facts in the brief. Where a fact is missing (a
date, a price, a quote), write [NEEDS: what] instead of
guessing. Describe the work in plain language: what it is
made of, how it looks, what it is about. No "explores",
"interrogates" or "invites the viewer".

Brief:
</pre>

**Inquiry reply.** For the inbox a gallery gets from its website and art
fairs:

<pre>
Here is an inquiry about a work, and what we know about the
sender. Classify it: collector, advisor, press, artist
submission, or other. Then draft a reply in under 120 words
that answers what they asked, offers the next step (price
list, viewing, call), and asks one question that tells us
how serious they are. Never state a price or availability
that is not in the notes below; write [CHECK] instead. Flag
anything that should go to the director before a reply.

Inquiry:
Notes:
</pre>
