"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { popularWikis } from "./popularWikis";
import WikiAutocomplete from "../components/wiki-autocomplete";

export default function Home() {
  // Popular wikis for quick access

  const inputRef = useRef<HTMLInputElement>(null);

  const [shortcutHint, setShortcutHint] = useState("Ctrl+Shift+F");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      setShortcutHint(isMac ? "Cmd+Shift+F" : "Ctrl+Shift+F");
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      inputRef.current?.focus();
    };
    window.addEventListener("focus-wiki-search", handler);
    return () => {
      window.removeEventListener("focus-wiki-search", handler);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
            Fandom Sucks
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            So I made this site that allows you to explore Fandom wikis with a
            clean, simplified interface and without all the browser debilitating
            ads and bloat and bologna.
          </p>

          <div className="mb-12">
            <WikiAutocomplete />
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-6">
              Popular Fandom Wikis
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {popularWikis.map((wiki) => (
                <motion.div
                  key={wiki.slug}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href={`/wiki/${wiki.slug}`}
                    className="block p-4 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate whitespace-nowrap overflow-hidden">
                        {wiki.name}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>Made with ❤️</p>
      </footer>
    </div>
  );
}
