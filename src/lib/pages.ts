import { getCollection, type CollectionEntry } from "astro:content";

export type Page = CollectionEntry<"pages">;

/**
 * Sort order for the homepage and nav: explicit `order` first (ascending),
 * then everything else alphabetically by title.
 *
 * Alphabetical is the honest default for a site with no chronology — it
 * makes no claim about importance or freshness, and "About" lands first
 * on its own without needing to be pinned.
 */
export function sortPages(pages: Page[]): Page[] {
  return [...pages].sort((a, b) => {
    const ao = a.data.order ?? Infinity;
    const bo = b.data.order ?? Infinity;
    if (ao !== bo) return ao - bo;
    return a.data.title.localeCompare(b.data.title);
  });
}

/** Every page, sorted. Includes those hidden from the homepage. */
export async function allPages(): Promise<Page[]> {
  return sortPages(await getCollection("pages"));
}

/** Only the pages that should appear on the homepage, sorted. */
export async function listedPages(): Promise<Page[]> {
  return sortPages(await getCollection("pages", ({ data }) => data.nav));
}
