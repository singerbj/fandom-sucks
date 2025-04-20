"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Calendar, Tag, Clock, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { fetchPageMetadata } from "@/lib/wiki-api";
import { useEffect, useState } from "react";
import { createImageProxyUrl } from "@/lib/utils";
import WikiSearch from "@/components/wiki-search";

interface WikiPageDetailProps {
  wiki: string;
  page: string;
}

export default function WikiPageDetailClient({
  wiki,
  page,
}: WikiPageDetailProps) {
  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchPageMetadata(wiki, page);
        if (!data) {
          notFound();
          return;
        }
        setPageData(data);
        setLoading(false);

        // Debug log to see image URLs
        if (data.images && data.images.length > 0) {
          console.log("Image URLs:", data.images.slice(0, 3));
        }
        if (data.thumbnail) {
          console.log("Thumbnail URL:", data.thumbnail);
        }
      } catch (err: any) {
        setError(err);
        setLoading(false);
        console.error(`Error loading page ${page} from wiki ${wiki}:`, err);
        notFound();
      }
    };

    fetchData();
  }, [wiki, page]);

  // Function to fix relative image URLs in the HTML content
  const fixImageUrls = (html: string): string => {
    // Replace relative image URLs with absolute URLs
    let fixed = html.replace(
      /src="\/([^"]+)"/g,
      `src="https://${wiki}.fandom.com/$1"`
    );

    // Also fix any URLs that might be using wikia.nocookie.net but missing the protocol
    fixed = fixed.replace(
      /src="\/\/static\.wikia\.nocookie\.net/g,
      'src="https://static.wikia.nocookie.net'
    );

    // This regex looks for img tags with data-src attributes
    const regex =
      /<img\s+(?:[^>]*?\s+)?(?:src="[^"]*")\s+(?:[^>]*?\s+)?(?:data-src="([^"]*)")/g;

    // Replace the src attribute with the data-src value
    fixed = fixed.replace(regex, (match, dataSrcValue) => {
      // Replace the existing src="..." with the data-src value
      return match.replace(/src="[^"]*"/, `src="${dataSrcValue}"`);
    });

    // Also use the image proxy instead of direct links for images
    fixed = fixed.replace(
      /https:\/\/static\.wikia\.nocookie\.net/g,
      `/api/proxy-image?url=https://static.wikia.nocookie.net`
    );

    // remove edit section brackets
    fixed = fixed.replace(
      /<span\s+class="(mw-editsection|mw-editsection-bracket)"[^>]*>[\s\S]*?<\/span>/g,
      ""
    );
    fixed = fixed.replace(
      /<a\s+title="(Sign in to edit)"[^>]*>[\s\S]*?<\/a>/g,
      ""
    );

    return fixed;
  };

  // Function to fix relative links in the HTML content
  const fixLinks = (html: string): string => {
    // Replace internal wiki links with our app links
    return html.replace(/href="\/wiki\/([^"]+)"/g, `href="/wiki/${wiki}/$1"`);
  };

  // Image lightbox handler
  const openLightbox = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  // Handle image load error
  const handleImageError = (imageUrl: string) => {
    console.error(`Failed to load image: ${imageUrl}`);
    setImageErrors((prev) => ({
      ...prev,
      [imageUrl]: true,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <h2 className="text-lg font-semibold text-red-800">Error</h2>
        <p className="text-red-700">{error.message}</p>
      </div>
    );
  }

  if (!pageData) {
    return <div>Not Found</div>;
  }

  // Format wiki name for display
  const wikiName = wiki
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const pageTitle = pageData.title || page.replace(/_/g, " ");
  const lastModified = pageData.lastModified
    ? new Date(pageData.lastModified)
    : null;

  // Filter out images that failed to load
  const validImages = pageData.images
    ? pageData.images.filter((img: string) => !imageErrors[img])
    : [];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-card rounded-lg border shadow-sm p-6 relative pr-[374px]"
      >
        <h1 className="text-3xl font-bold mb-4">{pageTitle}</h1>

        {/* {pageData.thumbnail && (
          <div className="mb-6">
            <Image
              src={
                createImageProxyUrl(pageData.thumbnail) || "/placeholder.svg"
              }
              alt={pageTitle}
              width={100}
              height={100}
              className="rounded-md object-cover cursor-pointer"
              onClick={() => openLightbox(pageData.thumbnail)}
              unoptimized
              onError={() => handleImageError(pageData.thumbnail)}
            />
          </div>
        )} */}

        <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
          {lastModified && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Last modified: {lastModified.toLocaleDateString()}</span>
            </div>
          )}

          {pageData.categories && pageData.categories.length > 0 && (
            <div className="flex items-center">
              <Tag className="h-4 w-4 mr-1" />
              <span>
                Categories: {pageData.categories.slice(0, 3).join(", ")}
              </span>
            </div>
          )}

          {pageData.length && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{pageData.length} bytes</span>
            </div>
          )}
        </div>

        {/* Full content section */}
        {pageData.fullContent ? (
          <div className="wiki-content prose max-w-none dark:prose-invert">
            <div
              dangerouslySetInnerHTML={{
                __html: fixLinks(fixImageUrls(pageData.fullContent)),
              }}
            />
          </div>
        ) : pageData.extract ? (
          <div className="prose max-w-none">
            <p>{pageData.extract}</p>
          </div>
        ) : (
          <p className="text-muted-foreground">
            No content available for this page.
          </p>
        )}

        {/* Image gallery section */}
        {validImages.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Images</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {validImages.map((image: string, index: number) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="aspect-square relative rounded-md overflow-hidden cursor-pointer"
                  onClick={() => openLightbox(image)}
                >
                  <Image
                    src={createImageProxyUrl(image) || "/placeholder.svg"}
                    alt={`Image ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={() => handleImageError(image)}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 pt-4 border-t">
          <a
            href={`https://${wiki}.fandom.com/wiki/${page}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            View original page on Fandom
          </a>
        </div>
      </motion.div>

      {/* Image lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <Image
              src={createImageProxyUrl(selectedImage) || "/placeholder.svg"}
              alt="Enlarged image"
              width={1200}
              height={800}
              className="object-contain max-h-[90vh]"
              unoptimized
              onError={() => handleImageError(selectedImage)}
            />
            <button
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-2"
              onClick={closeLightbox}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
