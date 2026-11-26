#!/usr/bin/env node
// Copy the public rows of the private time-saved.md log into /workflows.
//
//   npm run ledger -- ~/private-context/time-saved.md [--deny ~/private-context/ledger-deny.txt]
//
// Run locally, review the diff, commit. The private log never enters this
// repository and nothing here runs on Cloudflare: the build only sees the
// table already written into src/content/pages/workflows.md.
//
// The deny file is one term per line (customer, client, collector names).
// Any public row containing one stops the sync before anything is written.

import { readFileSync, writeFileSync } from "node:fs";
import { parse, select, render, splice } from "./ledger.js";

const PAGE = new URL("../src/content/pages/workflows.md", import.meta.url);

const args = process.argv.slice(2);
const d = args.indexOf("--deny");
const denyPath = d >= 0 ? args[d + 1] : null;
const source = args.find((a, i) => !a.startsWith("--") && i !== d + 1);

if (!source) {
  console.error("Usage: npm run ledger -- <path/to/time-saved.md> [--deny <file>]");
  process.exit(1);
}

try {
  const deny = denyPath ? readFileSync(denyPath, "utf8").split("\n") : [];
  const rows = select(parse(readFileSync(source, "utf8")), deny);
  writeFileSync(PAGE, splice(readFileSync(PAGE, "utf8"), render(rows)));
  console.log(`Ledger: ${rows.length} public rows written to workflows.md. Review the diff, then commit.`);
} catch (err) {
  console.error(`Ledger not written: ${err.message}`);
  process.exit(1);
}
