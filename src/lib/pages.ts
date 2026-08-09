import { getCollection, type CollectionEntry } from "astro:content";

export type Page = CollectionEntry<"pages">;

/**
 * Explicit `order` first, then everything else alphabetically by title.
 * Alphabetical is the honest default for a site with no chronology: it makes
 * no claim about importance or freshness.
 */
function sortPages(pages: Page[]): Page[] {
  return [...pages].sort((a, b) => {
    const ao = a.data.order ?? Infinity;
    const bo = b.data.order ?? Infinity;
    if (ao !== bo) return ao - bo;
    return a.data.title.localeCompare(b.data.title);
  });
}

/** Every page, including any hidden from the nav. */
export async function allPages(): Promise<Page[]> {
  return sortPages(await getCollection("pages"));
}

/** Only the pages listed in the nav. */
export async function listedPages(): Promise<Page[]> {
  return sortPages(await getCollection("pages", ({ data }) => data.nav));
}
