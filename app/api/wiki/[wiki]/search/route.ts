import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { wiki: string } }) {
  const { wiki } = params
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("query")

  if (!query) {
    return NextResponse.json({ error: "Search query is required" }, { status: 400 })
  }

  try {
    const apiUrl = `https://${wiki}.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`

    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error(`Failed to search wiki: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.query || !data.query.search) {
      return NextResponse.json({ results: [] })
    }

    const results = data.query.search.map((result: any) => ({
      pageid: result.pageid,
      title: result.title,
      snippet: result.snippet,
    }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error(`Error searching ${wiki} wiki:`, error)
    return NextResponse.json({ error: "Failed to search wiki" }, { status: 500 })
  }
}
