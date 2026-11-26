---
title: Projects
order: 6
description: Things Ryan Watt is building, and three case studies in changing how customer and gallery work gets done with AI.
---

[Ryan the art expert](/art-expert) is a video conversation with an AI version of me
about art from the cave paintings to today, built on Kaltura's conversational
avatars.

[Art Moves](https://art-moves.pages.dev/) is a weekly brief on who is
buying at the top of the art and luxury markets, what they paid, and what it
says about how wealthy families protect and grow capital.

[Gallery Assistant](https://gallery-assistant.pages.dev/) is a prototype for
managing gallery inquiries, collector relationships, and opportunities with
reviewed outreach. The demo uses fictional data.

## Case studies

### Monte Clark Gallery: AI in daily gallery work

**Problem.** A small gallery team writes everything by hand for every show:
the press release, the website text, the captions, the note to collectors.
Each is written from scratch, and inquiries wait while it happens.

**What I did.** Set the gallery up on its own Claude workspace with the
house style, artist histories and past releases loaded as context. One
exhibition brief now produces the full press kit, with any missing fact
marked rather than guessed. Inquiries go through the
[Gallery Assistant](https://gallery-assistant.pages.dev/), which sorts them,
drafts the reply, and keeps the collector history next to it.

**How it runs.** Every message still goes out under a person's name, after a
person reads it. The press kit and inquiry prompts are on
[Workflows](/workflows).

### Kaltura: value realization from usage data

**Problem.** A renewal conversation needs proof of value, but the proof is
spread across Salesforce usage objects, the platform's usage API, contracts
and call recordings. Assembled by hand it is slow, so it tends to happen only
when a renewal forces it.

**What I did.** Built a Claude Code workspace that runs in the terminal
against one local server reading all of those sources. Slash commands turn
twelve months of measured usage into dollars at published benchmark rates,
show what the customer pays for and doesn't use, and build the executive
deck. A scheduled loop reads every account each Monday and drafts one
specific tip per account. The same prompt runs in Databricks Genie against
the usage warehouse, so the two sets of numbers check each other.

**How it runs.** Read-only by default. Any CRM write is a dry run first, only
on records I own, and only after I approve the diff. Email is draft-only.
Customer data stays out of the code. An anonymized version is
[public on GitHub](https://github.com/ryanbwatt/account-command-center).

### Revin: one command center for customer success

**Problem.** Revin was adding customers faster than a small team could
onboard them by hand. Each onboarding meant connecting a different
ServiceTitan and Salesforce setup, and the process had to hold up at three
times the volume.

**What I did.** Built the customer success function AI-native from the start:
one command center holding the playbooks, SOPs and onboarding steps, with
agentic workflows and AI support automation running off it. Stood up the
Forward Deployed Engineering team to work from the same playbooks, and moved
the company's calling and messaging from Twilio to Bandwidth.

**Result.** Live customers grew from 30 to more than 100 and revenue four
times over, with a Forward Deployed Engineering team of six.
