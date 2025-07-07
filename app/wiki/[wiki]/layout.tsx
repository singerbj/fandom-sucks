import WikiSearch from "@/components/wiki-search";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { popularWikis } from "../../popularWikis";

export default async function WikiSubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { wiki?: string };
}) {
  const wiki = (await params).wiki || "";

  // Format wiki name for display
  let wikiName = wiki
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  const found = popularWikis.find((w) => w.slug === wiki);
  if (found) wikiName = found.name;

  return (
    <>
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Home
            </Link>
            <ChevronRight className="ml-1 mr-1 h-4 w-4 inline-block" />
            <Link
              href={`/wiki/${wiki}`}
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {wikiName} Wiki
            </Link>
            <h1 className="text-3xl font-bold mt-8 mb-2">{wikiName} Wiki</h1>
            <p className="text-muted-foreground">
              Exploring content from {wikiName} Fandom Wiki
            </p>
          </div>
          <div className="flex-1 mb-4">
            <WikiSearch wiki={wiki} />
          </div>
        </div>
        {children}
      </div>
    </>
  );
}
