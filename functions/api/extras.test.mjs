// node functions/api/extras.test.mjs — parser check on a fixture, then a live run.
import assert from "node:assert";
import { parse, onRequest } from "./extras.js";

const [i] = parse(
  `<item><title><![CDATA[Kerr &amp; the mile]]></title><link>https://x.test/a?b=1&amp;c=2</link>
   <description>&lt;p&gt;Fast.&lt;/p&gt; &lt;a href="#"&gt;Continue reading...&lt;/a&gt;</description>
   <pubDate>Fri, 23 Oct 2026 12:00:00 GMT</pubDate>
   <media:thumbnail url="https://ichef.bbci.co.uk/ace/standard/240/x.jpg"/></item>`,
  "Track & Field", "BBC Sport",
);
assert.equal(i.title, "Kerr & the mile");
assert.equal(i.link, "https://x.test/a?b=1&c=2");
assert.equal(i.summary, "Fast.");
assert.equal(i.image, "https://ichef.bbci.co.uk/ace/standard/976/x.jpg");
assert.equal(i.date, Date.UTC(2026, 9, 23, 12));

if (process.argv[2] === "live") {
  const items = await (await onRequest()).json();
  const by = Object.groupBy(items, (x) => `${x.section} / ${x.source}`);
  for (const [k, v] of Object.entries(by)) console.log(k.padEnd(36), v.length, "items,", v.filter((x) => x.image).length, "with images");
  console.log(items.slice(0, 3));
}
console.log("ok");
