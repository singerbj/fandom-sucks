import WikiSearch from "@/components/wiki-search";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type React from "react";
export default async function WikiSubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { wiki?: string };
}) {
  const wiki = (await params).wiki || "";

  // Format wiki name for display
  const wikiName = wiki
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  console.log("params");
  return (
    <>
      <div className="container mx-auto px-4 py-4">
        <div className="flex">
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
          <div className="flex-0 min-w-96 mb-4">
            <WikiSearch wiki={wiki} />
          </div>
        </div>
        {children}
      </div>
    </>
  );
}
