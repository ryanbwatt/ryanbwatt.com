---
title: Workflows
order: 7
description: The work Ryan Watt has handed to AI, the hours it gives back, the $40 a month stack it runs on, and prompts anyone can reuse.
---

What I've handed to AI and the time it gives back. Names of customers,
clients and collectors are left out.

## Hours saved

<!-- ledger:start -->
<table id="ledger">
  <thead>
    <tr><th>Workflow</th><th>Stack / Skill</th><th>Before vs. after</th><th>Monthly hours saved</th></tr>
  </thead>
  <tbody>
    <tr><td>Account review prep</td><td>Internal account-review tool</td><td>4 h → 45 min a review</td><td>10</td></tr>
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

The prompts behind this are [free to reuse](/prompts).
