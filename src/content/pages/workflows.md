---
title: Workflows
order: 7
description: The work Ryan Watt has handed to AI, the hours it gives back, the $40 a month stack it runs on, and prompts anyone can reuse.
---

The work I've handed to AI, what it gives back, what it runs on, and the
prompts behind it. The numbers come from a log I keep as I go. Customer,
client and collector names are taken out before anything reaches this page.

## Time reclaimed ledger

<!-- ledger:start -->
<table id="ledger">
  <thead>
    <tr><th>Workflow</th><th>Stack / Skill</th><th>Before vs. after</th><th>Monthly hours saved</th></tr>
  </thead>
  <tbody>
    <tr><td>Enterprise QBR telemetry assembly</td><td>Databricks Genie, Claude API</td><td>4 h → 45 min a review</td><td>10</td></tr>
    <tr><td>Personal finance and task triage</td><td>Perplexity, Todoist</td><td>3 h → 1 h a week</td><td>8</td></tr>
    <tr><td>Gallery exhibition press kits</td><td>Claude Team, <code>press-release</code> Skill</td><td>2 h → 30 min a show</td><td>6</td></tr>
    <tr><td>Total</td><td></td><td></td><td>24</td></tr>
  </tbody>
</table>
<!-- ledger:end -->

Before and after are my time per run, start to finish, including review.
Monthly hours saved is the time saved per run multiplied by how often it
runs.

## My $40/month AI stack

What I pay for myself. Employer workspaces are separate, paid for by the
employer, and never share data with this stack.

| Job | Tool | A month | What it does |
| --- | --- | --- | --- |
| Research | Perplexity Pro | $20 | Anything that needs a current, cited source: companies, markets, people |
| Drafting and Skills | Claude Pro | $20 | Thinking, first drafts, and writing the Skills that make a task repeatable |
| Local execution | Claude Code, GitHub, Cloudflare Pages | $0 extra | Changes files and runs scripts and scheduled jobs; GitHub versions every Skill and site; Cloudflare deploys on every push |

How a task gets routed:

<pre>
task
 |
 +-- needs a cited, current source? ---- Perplexity Pro
 |
 +-- needs thinking or a draft? -------- Claude
 |                                         |
 |                         turns into a repeatable Skill
 |                                         |
 +-- needs files changed or code run? -- Claude Code
                                           |
                                         GitHub  (commit)
                                           |
                                         Cloudflare Pages (deploy)
</pre>

The rule is to do each thing once. Research that will be reused goes into a
file, a prompt used twice becomes a Skill, and a Skill used every week gets a
schedule.

## Skills anyone can reuse

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
