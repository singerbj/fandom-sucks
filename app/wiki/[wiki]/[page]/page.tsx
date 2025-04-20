import WikiPageDetailClient from "./WikiPageDetailClient";
import { fetchPageMetadata } from "@/lib/wiki-api";

export async function generateMetadata({
  params,
}: {
  params: { wiki: string; page: string };
}) {
  const { wiki, page } = params;

  try {
    const pageData = await fetchPageMetadata(wiki, page);
    const pageTitle = pageData?.title || page;

    return {
      title: `${pageTitle} - ${wiki} Wiki`,
      description:
        pageData?.extract ||
        `Information about ${pageTitle} from the ${wiki} Fandom wiki.`,
    };
  } catch (error) {
    return {
      title: `${page} - ${wiki} Wiki`,
      description: `Information about ${page} from the ${wiki} Fandom wiki.`,
    };
  }
}

export default function WikiPageDetail({
  params,
}: {
  params: { wiki: string; page: string };
}) {
  const { wiki, page } = params;

  return <WikiPageDetailClient wiki={wiki} page={page} />;
}
