#!/usr/bin/env node
/**
 * Reads the colour tokens straight out of src/styles/tokens.css and checks
 * every foreground against its ground for WCAG AA (4.5:1).
 *
 * The point is that you can retheme the site freely — that's the whole
 * design — without quietly shipping grey-on-grey. Run it after any colour
 * change: `npm run contrast`.
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const TOKENS = fileURLToPath(
  new URL("../src/styles/tokens.css", import.meta.url),
);

const AA = 4.5;
const FOREGROUNDS = ["ink", "ink-strong", "ink-mute", "accent"];

const toRgb = (h) => {
  const v = h.replace("#", "");
  const n = parseInt(
    v.length === 3
      ? v
          .split("")
          .map((c) => c + c)
          .join("")
      : v,
    16,
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const channel = (c) => {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
  const [r, g, b] = toRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Pull `--name: #hex;` pairs out of a chunk of CSS. */
const parse = (css) => {
  const out = {};
  for (const [, name, hex] of css.matchAll(
    /--([a-z-]+):\s*(#[0-9a-fA-F]{3,6})\s*;/g,
  )) {
    out[name] = hex.toLowerCase();
  }
  return out;
};

const css = await readFile(TOKENS, "utf8");

// The dark block is the @media prefers-color-scheme section; light is the rest.
const darkStart = css.indexOf("@media (prefers-color-scheme: dark)");
const light = parse(darkStart === -1 ? css : css.slice(0, darkStart));
const darkOverrides = darkStart === -1 ? {} : parse(css.slice(darkStart));
const dark = { ...light, ...darkOverrides };

const themes = Object.entries({ light, dark }).filter(
  ([name]) => name === "light" || darkStart !== -1,
);

let failed = 0;

for (const [name, tokens] of themes) {
  console.log(`\n${name}  (ground ${tokens.ground})`);
  for (const fg of FOREGROUNDS) {
    if (!tokens[fg]) continue;
    const ratio = contrast(tokens[fg], tokens.ground);
    const ok = ratio >= AA;
    if (!ok) failed++;
    console.log(
      `  ${ok ? "PASS" : "FAIL"}  --${fg.padEnd(11)} ${tokens[fg]}  ${ratio.toFixed(2)}:1`,
    );
  }
}

if (failed > 0) {
  console.error(
    `\n${failed} token${failed === 1 ? "" : "s"} below AA (${AA}:1). Adjust tokens.css.`,
  );
  process.exit(1);
}

console.log(`\nAll tokens meet AA (${AA}:1).`);
