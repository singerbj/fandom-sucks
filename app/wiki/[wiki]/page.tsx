import { Suspense } from "react";
import { notFound } from "next/navigation";
import WikiPageList from "@/components/wiki-page-list";
import { fetchWikiPages } from "@/lib/wiki-api";
import { popularWikis } from "../../popularWikis";

export async function generateMetadata({
  params,
}: {
  params: { wiki: string };
}) {
  const { wiki } = params;

  let wikiName = wiki.charAt(0).toUpperCase() + wiki.slice(1);
  const found = popularWikis.find((w) => w.slug === wiki);
  if (found) wikiName = found.name;

  return {
    title: `${wikiName} Wiki Explorer`,
    description: `Explore the ${wikiName} Fandom wiki with a clean, simplified interface.`,
  };
}

export default async function WikiPage({
  params,
}: {
  params: { wiki: string };
}) {
  const { wiki } = params;

  try {
    // This will be cached by Next.js
    const initialPages = await fetchWikiPages(wiki);

    return (
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Pages</h2>
        <Suspense
          fallback={
            <div className="p-8 text-center">Loading wiki pages...</div>
          }
        >
          <WikiPageList wiki={wiki} initialPages={initialPages} />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error(`Error loading wiki ${wiki}:`, error);
    notFound();
  }
}
