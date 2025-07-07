"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { popularWikis } from "../app/popularWikis";
import { Search } from "lucide-react";

export default function WikiAutocomplete() {
  const [query, setQuery] = useState("");
  const [filteredWikis, setFilteredWikis] = useState(popularWikis);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [shortcutHint, setShortcutHint] = useState("Ctrl+Shift+F");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      setShortcutHint(isMac ? "Cmd+Shift+F" : "Ctrl+Shift+F");
    }
  }, []);

  // Focus on input when custom event is fired
  useEffect(() => {
    const handler = () => {
      inputRef.current?.focus();
    };
    window.addEventListener("focus-wiki-search", handler);
    return () => {
      window.removeEventListener("focus-wiki-search", handler);
    };
  }, []);

  // Filter wikis as user types
  useEffect(() => {
    if (!query.trim()) {
      setFilteredWikis(popularWikis);
      setSelectedIndex(0);
      return;
    }
    const q = query.toLowerCase();
    const filtered = popularWikis.filter(
      (wiki) =>
        wiki.name.toLowerCase().includes(q) ||
        wiki.slug.toLowerCase().includes(q)
    );
    setFilteredWikis(filtered);
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || filteredWikis.length === 0) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredWikis.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredWikis[selectedIndex]) {
          router.push(`/wiki/${filteredWikis[selectedIndex].slug}`);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowResults(false);
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  const handleResultClick = (slug: string) => {
    router.push(`/wiki/${slug}`);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="flex w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 100)}
            onKeyDown={handleKeyDown}
            placeholder={`Enter wiki name or subdomain (${shortcutHint})`}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            autoComplete="off"
            required
          />
        </div>
        <button
          type="button"
          className="ml-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          onClick={() => {
            if (filteredWikis[selectedIndex]) {
              router.push(`/wiki/${filteredWikis[selectedIndex].slug}`);
            }
          }}
        >
          Explore
        </button>
      </div>
      {showResults && filteredWikis.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute z-10 mt-2 w-full bg-card rounded-md border shadow-lg max-h-80 overflow-auto"
        >
          <ul className="py-2">
            {filteredWikis.map((wiki, idx) => (
              <li key={wiki.slug}>
                <button
                  type="button"
                  onMouseDown={() => handleResultClick(wiki.slug)}
                  className={`w-full px-4 py-2 text-left transition-colors ${
                    idx === selectedIndex
                      ? "bg-accent font-medium"
                      : "hover:bg-accent/50"
                  }`}
                  role="option"
                  aria-selected={idx === selectedIndex}
                >
                  <span className="font-medium">{wiki.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {wiki.slug}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
