// GET /api/extras — the Extras page's feed. A Cloudflare Pages Function: it
// fetches a short list of reputable RSS feeds, merges them, and returns JSON.
// Nothing is written by us; every item links back to its publisher.
//
// To change what appears, edit FEEDS. Sections are the page's tabs.

export const FEEDS = [
  ["Track & Field", "BBC Sport", "https://feeds.bbci.co.uk/sport/athletics/rss.xml"],
  ["Track & Field", "The Guardian", "https://www.theguardian.com/sport/athletics/rss"],
  ["Track & Field", "LetsRun", "https://www.letsrun.com/feed"],
  ["Cycling", "Cyclingnews", "https://www.cyclingnews.com/feeds.xml"],
  ["Cycling", "BBC Sport", "https://feeds.bbci.co.uk/sport/cycling/rss.xml"],
  ["Cycling", "The Guardian", "https://www.theguardian.com/sport/cycling/rss"],
  ["Endurance", "Triathlete", "https://www.triathlete.com/feed/"],
  ["Tennis", "BBC Sport", "https://feeds.bbci.co.uk/sport/tennis/rss.xml"],
  ["Tennis", "The Guardian", "https://www.theguardian.com/sport/tennis/rss"],
  ["Business", "The New York Times", "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml"],
  ["Business", "The Guardian", "https://www.theguardian.com/business/rss"],
  ["AI", "The Guardian", "https://www.theguardian.com/technology/artificialintelligenceai/rss"],
  ["Architecture", "Dezeen", "https://www.dezeen.com/feed/"],
  ["Architecture", "ArchDaily", "https://www.archdaily.com/feed"],
  ["Architecture", "The Guardian", "https://www.theguardian.com/artanddesign/architecture/rss"],
  ["Art", "The New York Times", "https://rss.nytimes.com/services/xml/rss/nyt/ArtandDesign.xml"],
  ["Art", "The Guardian", "https://www.theguardian.com/artanddesign/art/rss"],
];

const PER_FEED = 8;

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s) =>
  s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) =>
    e[0] === "#"
      ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : +e.slice(1))
      : ENTITIES[e] ?? m,
  );
const cdata = (s) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? cdata(m[1]).trim() : "";
};
const text = (html) =>
  decode(decode(html).replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .replace(/(Continue reading|The post .* appeared first on|Read the full article at).*$/, "")
    .trim();

// The biggest image a feed offers: Guardian lists two media:content sizes, so
// take the last; BBC only offers a 240px thumbnail, but its CDN serves the
// same image at any width in the path.
function image(item) {
  const media = [...item.matchAll(/<media:(?:content|thumbnail)[^>]*url="([^"]+)"/g)].map((m) => m[1]);
  const url =
    media.at(-1) ||
    item.match(/<enclosure[^>]*url="([^"]+)"/)?.[1] ||
    decode(item).match(/<img[^>]*src="([^"]+)"/)?.[1] ||
    "";
  return decode(url).replace("/ace/standard/240/", "/ace/standard/976/");
}

export function parse(xml, section, source) {
  return [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/g)].slice(0, PER_FEED).map(([item]) => {
    const summary = text(tag(item, "description") || tag(item, "dc:content"));
    return {
      section,
      source,
      title: text(tag(item, "title")),
      link: decode(tag(item, "link")),
      summary: summary.length > 280 ? summary.slice(0, 277).replace(/\s\S*$/, "") + "…" : summary,
      image: image(item),
      date: Date.parse(tag(item, "pubDate")) || 0,
    };
  });
}

export async function onRequest() {
  const results = await Promise.allSettled(
    FEEDS.map(async ([section, source, url]) => {
      const res = await fetch(url, {
        headers: { "user-agent": "ryanbwatt.com extras" },
        cf: { cacheTtl: 600 },
      });
      return res.ok ? parse(await res.text(), section, source) : [];
    }),
  );
  // A dead feed drops out quietly rather than taking the page down.
  const seen = new Set();
  const items = results
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .filter((i) => i.title && i.link && !seen.has(i.link) && seen.add(i.link))
    .sort((a, b) => b.date - a.date);

  return Response.json(items, {
    headers: { "cache-control": "public, max-age=300, s-maxage=600" },
  });
}
