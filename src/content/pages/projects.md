---
title: Projects
order: 6
description: Three case studies in changing how customer and gallery work gets done with AI, and the things Ryan Watt is building.
---

## Monte Clark Gallery: AI transformation and Gallery Assistant

**Problem.** Press kits, artwork cataloguing and collector emails were each
done by hand, by different people, from scratch every show.

**Architecture.** Moved gallery operations onto a separate Claude Team
workspace with three shared Skills: `press-release`, `artwork-catalog` and
`collector-outreach`. A custom
[Gallery Assistant](https://gallery-assistant.pages.dev/) now sits in the
staff's daily work, sorting inquiries and drafting replies next to the
collector history. The demo uses fictional data.

**Impact.** The same quality of output from everyone on the team, and
recurring exhibition prep cut from hours to minutes.

## Kaltura: value realization with Databricks Genie

**Problem.** Pulling platform usage and assembling executive QBRs was manual
work for every enterprise financial services and L&D account.

**Architecture.** Terminal-run Claude API reporting loops on top of
Databricks Genie, Kaltura's in-house data assistant. The loops query
platform usage, then write the executive ROI story from it. An anonymized
version is [on GitHub](https://github.com/ryanbwatt/account-command-center).

**Impact.** Spreadsheet compilation replaced by repeatable Customer Value
Realization (CVR) reports, with every number traced to its source.

## Revin: CS operations in one command center

**Problem.** During hypergrowth, onboarding had no fixed structure and
playbooks were run differently by each person.

**Architecture.** Moved customer health tracking, onboarding milestones and
the standard CS workflows into one command center, while growing the
Forward Deployed Engineer team from 2 to 8.

**Impact.** Customers grew from 30 to more than 100 and revenue four times
over, with the same post-sales process for every account.

## Other projects

[Ryan the art expert](/art-expert) is a video conversation with an AI version of me
about art from the cave paintings to today, built on Kaltura's conversational
avatars.

[Art Moves](https://art-moves.pages.dev/) is a weekly brief on who is
buying at the top of the art and luxury markets, what they paid, and what it
says about how wealthy families protect and grow capital.
