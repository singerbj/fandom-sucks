"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { popularWikis } from "../app/popularWikis";

interface WikiSearchProps {
  wiki: string | undefined;
}

export default function WikiSearch({ wiki }: WikiSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resultsRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [shortcutHint, setShortcutHint] = useState("Ctrl+Shift+F");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Compute display name for wiki
  let wikiName = wiki || "";
  if (wikiName) {
    const found = popularWikis.find((w) => w.slug === wikiName);
    if (found) wikiName = found.name;
    else {
      wikiName = wikiName
        .split(/[-_]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
  }

  // Autofocus on input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Listen for custom event to focus search input
  useEffect(() => {
    const handler = () => {
      inputRef.current?.focus();
    };
    window.addEventListener("focus-wiki-search", handler);
    return () => {
      window.removeEventListener("focus-wiki-search", handler);
    };
  }, []);

  // Platform-specific shortcut hint
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      setShortcutHint(isMac ? "Cmd+Shift+F" : "Ctrl+Shift+F");
    }
  }, []);

  // Debounced search function
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/wiki/${wiki}/search?query=${encodeURIComponent(searchQuery)}`
        );
        const data = await response.json();

        if (data.results && data.results.length > 0) {
          setSearchResults(data.results);
          // Auto-select the first result
          setSelectedIndex(0);
        } else {
          setSearchResults([]);
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error("Error searching wiki:", error);
        setSearchResults([]);
        setSelectedIndex(-1);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, wiki]);

  const handleResultClick = (title: string) => {
    setSearchResults([]);
    setSearchQuery("");
    router.push(`/wiki/${wiki}/${title.replace(/ /g, "_")}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (searchResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prevIndex) =>
          prevIndex < searchResults.length - 1 ? prevIndex + 1 : prevIndex
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleResultClick(searchResults[selectedIndex].title);
        }
        break;
      case "Escape":
        e.preventDefault();
        setSearchResults([]);
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [selectedIndex]);

  return (
    <div className="relative">
      <div className="flex w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Search ${wikiName} wiki (${shortcutHint})...`}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            aria-autocomplete="list"
            aria-controls="search-results"
            aria-expanded={searchResults.length > 0}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              Searching...
            </div>
          )}
        </div>
      </div>

      {searchResults.length > 0 && (
        <div
          id="search-results"
          ref={scrollContainerRef}
          className="absolute z-10 mt-2 w-full bg-card rounded-md border shadow-lg max-h-80 overflow-auto"
        >
          <ul className="py-2" ref={resultsRef}>
            {searchResults.map((result, index) => (
              <li key={index}>
                <button
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  onClick={() => handleResultClick(result.title)}
                  className={`w-full px-4 py-2 text-left transition-colors ${
                    index === selectedIndex
                      ? "bg-accent font-medium"
                      : "hover:bg-accent/50"
                  }`}
                  role="option"
                  aria-selected={index === selectedIndex}
                >
                  {result.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
