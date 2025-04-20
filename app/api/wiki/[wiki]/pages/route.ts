import { type NextRequest, NextResponse } from "next/server"
import { fetchWikiPages } from "@/lib/wiki-api"

export async function GET(request: NextRequest, { params }: { params: { wiki: string } }) {
  const { wiki } = params
  const searchParams = request.nextUrl.searchParams
  const continueFrom = searchParams.get("continue")

  try {
    const pages = await fetchWikiPages(wiki, continueFrom || undefined)

    // For demonstration, we're simulating a continuation token
    // In a real app, you would extract this from the API response
    const continuation = pages.length === 500 ? pages[pages.length - 1].title : null

    return NextResponse.json({
      pages,
      continuation,
    })
  } catch (error) {
    console.error(`Error fetching pages for ${wiki}:`, error)
    return NextResponse.json({ error: "Failed to fetch wiki pages" }, { status: 500 })
  }
}
