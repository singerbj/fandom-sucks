"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight } from "lucide-react"
import type { WikiPage } from "@/lib/types"

interface WikiPageListProps {
  wiki: string
  initialPages: WikiPage[]
}

export default function WikiPageList({ wiki, initialPages }: WikiPageListProps) {
  const [pages, setPages] = useState<WikiPage[]>(initialPages)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialPages.length === 500)
  const [continuation, setContinuation] = useState<string | null>(null)

  const loadMorePages = async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/wiki/${wiki}/pages?continue=${continuation || ""}`)
      const data = await response.json()

      if (data.pages && data.pages.length > 0) {
        setPages([...pages, ...data.pages])
        setContinuation(data.continuation)
        setHasMore(!!data.continuation)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error("Error loading more pages:", error)
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <AnimatePresence>
          {pages.map((page, index) => (
            <motion.div
              key={page.pageid || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: (index % 10) * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="bg-card rounded-lg border shadow-sm overflow-hidden"
            >
              <Link href={`/wiki/${wiki}/${page.title.replace(/ /g, "_")}`} className="block p-4 h-full">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium truncate">{page.title}</h3>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                </div>
                {page.length && <p className="text-sm text-muted-foreground mt-1">{page.length} bytes</p>}
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMorePages}
            disabled={isLoading}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Load More Pages"}
          </button>
        </div>
      )}

      {!hasMore && pages.length > 0 && (
        <p className="mt-8 text-center text-sm text-muted-foreground">All pages loaded</p>
      )}

      {pages.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">No pages found for this wiki.</p>
        </div>
      )}
    </div>
  )
}
