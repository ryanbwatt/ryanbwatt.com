import { test } from "node:test";
import assert from "node:assert/strict";
import { minutes, parse, select, render, splice, START, END } from "./ledger.js";

const LOG = `# Time saved

Notes above the table are ignored.

| Task | Tools | Before | After | Runs/mo | Public | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Renewal value story | /value-id | 3 h | 20 min | 2 | yes | private note |
| Acme Corp QBR prep | /business-review | 4h | 45m | 1 | no | |
| Weekly account pulse | /pulse-tip | 90 | 10 | 4 | y | |
`;

test("minutes reads the formats the log uses", () => {
  assert.equal(minutes("90"), 90);
  assert.equal(minutes("90 min"), 90);
  assert.equal(minutes("1.5 h"), 90);
  assert.equal(minutes("1h 30m"), 90);
  assert.ok(Number.isNaN(minutes("soon")));
});

test("only public rows are kept, and extra columns are ignored", () => {
  const rows = select(parse(LOG));
  assert.deepEqual(rows.map((r) => r.task), ["Renewal value story", "Weekly account pulse"]);
  assert.ok(!render(rows).includes("private note"));
});

test("a deny-listed term in a public row stops the sync", () => {
  assert.throws(() => select(parse(LOG), ["pulse"]), /Deny-listed/);
  // Private rows may contain anything.
  assert.doesNotThrow(() => select(parse(LOG), ["Acme"]));
});

test("hours a month = (before - after) x runs, sorted, with a total", () => {
  const html = render(select(parse(LOG)));
  // value story: (180-20)*2/60 = 5.3; pulse: (90-10)*4/60 = 5.3 -> both 5.3, total 10.7
  assert.match(html, /<td>Total<\/td><td><\/td><td><\/td><td><\/td><td>10\.7<\/td>/);
  assert.match(html, /<td>3 h<\/td><td>20 min<\/td>/);
});

test("task text is escaped", () => {
  const rows = select(parse(LOG.replace("Renewal value story", "<b>x</b>")));
  assert.ok(render(rows).includes("&lt;b&gt;x&lt;/b&gt;"));
});

test("splice replaces only what sits between the markers", () => {
  const page = `before\n${START}\nold\n${END}\nafter`;
  assert.equal(splice(page, "new"), `before\n${START}\nnew\n${END}\nafter`);
  assert.throws(() => splice("no markers", "x"), /Markers/);
});
