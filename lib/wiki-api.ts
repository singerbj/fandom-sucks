import { cache } from "react"
import type { WikiPage, WikiPageMetadata } from "./types"

// Cache the fetch for all pages
export const fetchWikiPages = cache(async (wiki: string, continueFrom?: string): Promise<WikiPage[]> => {
  const apiUrl = `https://${wiki}.fandom.com/api.php?action=query&list=allpages&aplimit=500&format=json&origin=*${
    continueFrom ? `&apcontinue=${continueFrom}` : ""
  }`

  try {
    const response = await fetch(apiUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch wiki pages: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.query || !data.query.allpages) {
      return []
    }

    return data.query.allpages.map((page: any) => ({
      pageid: page.pageid,
      title: page.title,
      length: page.length,
    }))
  } catch (error) {
    console.error(`Error fetching pages for ${wiki}:`, error)
    throw error
  }
})

// Helper function to fetch image URLs
async function fetchImageUrls(wiki: string, imageNames: string[]): Promise<Record<string, string>> {
  if (!imageNames.length) return {}

  // Format the image titles for the API request
  const formattedTitles = imageNames
    .map((name) => {
      // Ensure the image name has the "File:" prefix
      if (!name.startsWith("File:")) {
        return `File:${name}`
      }
      return name
    })
    .join("|")

  const apiUrl = `https://${wiki}.fandom.com/api.php?action=query&titles=${encodeURIComponent(formattedTitles)}&prop=imageinfo&iiprop=url&format=json&origin=*`

  try {
    const response = await fetch(apiUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch image URLs: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.query || !data.query.pages) {
      return {}
    }

    const imageUrls: Record<string, string> = {}

    // Extract the URLs from the response
    Object.values(data.query.pages).forEach((page: any) => {
      if (page.imageinfo && page.imageinfo.length > 0) {
        const title = page.title.replace(/^File:/, "") // Remove "File:" prefix for easier lookup

        // Get the URL and ensure it has https:// prefix if it's a wikia.nocookie.net URL
        let url = page.imageinfo[0].url
        if (url.includes("static.wikia.nocookie.net") && url.startsWith("//")) {
          url = "https:" + url
        }

        imageUrls[title] = url
      }
    })

    return imageUrls
  } catch (error) {
    console.error(`Error fetching image URLs for ${wiki}:`, error)
    return {}
  }
}

// Cache the fetch for page metadata and content
export const fetchPageMetadata = cache(async (wiki: string, pageTitle: string): Promise<WikiPageMetadata | null> => {
  // Decode the page title if it's URL encoded
  const decodedPageTitle = decodeURIComponent(pageTitle.replace(/_/g, " "))

  // First, get the basic metadata and list of images on the page
  const metadataUrl = `https://${wiki}.fandom.com/api.php?action=query&titles=${encodeURIComponent(
    decodedPageTitle,
  )}&prop=info|revisions|categories|pageprops|images|extracts&exintro=1&format=json&origin=*`

  try {
    const metadataResponse = await fetch(metadataUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!metadataResponse.ok) {
      throw new Error(`Failed to fetch page metadata: ${metadataResponse.statusText}`)
    }

    const metadataData = await metadataResponse.json()

    if (!metadataData.query || !metadataData.query.pages) {
      return null
    }

    // The API returns an object with page IDs as keys
    const pageId = Object.keys(metadataData.query.pages)[0]

    // If the page doesn't exist, the API returns a negative page ID
    if (Number.parseInt(pageId) < 0) {
      return null
    }

    const page = metadataData.query.pages[pageId]

    // Extract categories
    const categories = page.categories ? page.categories.map((cat: any) => cat.title.replace("Category:", "")) : []

    // Get the list of images on the page
    const imageNames: string[] = page.images ? page.images.map((img: any) => img.title.replace(/^File:/, "")) : []

    // Fetch image URLs using the helper function
    const imageUrlMap = await fetchImageUrls(wiki, imageNames)

    // Create an array of image URLs
    const images = Object.values(imageUrlMap).filter(Boolean) as string[]

    // Get a thumbnail if available
    let thumbnail = null

    // Try to get the main image (thumbnail) using pageimages property
    const thumbnailUrl = `https://${wiki}.fandom.com/api.php?action=query&titles=${encodeURIComponent(
      decodedPageTitle,
    )}&prop=pageimages&format=json&pithumbsize=500&origin=*`

    const thumbnailResponse = await fetch(thumbnailUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (thumbnailResponse.ok) {
      const thumbnailData = await thumbnailResponse.json()

      if (thumbnailData.query && thumbnailData.query.pages && thumbnailData.query.pages[pageId]) {
        const pageData = thumbnailData.query.pages[pageId]
        if (pageData.thumbnail && pageData.thumbnail.source) {
          let thumbUrl = pageData.thumbnail.source

          // Ensure thumbnail URL has https:// prefix if it's a wikia.nocookie.net URL
          if (thumbUrl.includes("static.wikia.nocookie.net") && thumbUrl.startsWith("//")) {
            thumbUrl = "https:" + thumbUrl
          }

          thumbnail = thumbUrl
        }
      }
    }

    // If no thumbnail was found via pageimages, use the first image from our list
    if (!thumbnail && images.length > 0) {
      thumbnail = images[0]
    }

    // Extract the text content (intro only)
    const extract = page.extract || null

    // Get the last modified date
    const lastModified = page.revisions && page.revisions.length > 0 ? page.revisions[0].timestamp : null

    // Now, get the full parsed HTML content
    const contentUrl = `https://${wiki}.fandom.com/api.php?action=parse&page=${encodeURIComponent(
      decodedPageTitle,
    )}&prop=text&format=json&origin=*`

    const contentResponse = await fetch(contentUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    let fullContent = null
    if (contentResponse.ok) {
      const contentData = await contentResponse.json()
      if (contentData.parse && contentData.parse.text) {
        fullContent = contentData.parse.text["*"]
      }
    }

    return {
      pageid: page.pageid,
      title: page.title,
      length: page.length,
      lastModified,
      categories,
      images,
      thumbnail,
      extract,
      fullContent,
      imageNames, // Store the original image names for reference
    }
  } catch (error) {
    console.error(`Error fetching metadata for ${pageTitle} from ${wiki}:`, error)
    throw error
  }
})

// Cache the fetch for wiki images
export const fetchWikiImages = cache(async (wiki: string, limit = 100): Promise<string[]> => {
  const apiUrl = `https://${wiki}.fandom.com/api.php?action=query&list=allimages&ailimit=${limit}&format=json&origin=*`

  try {
    const response = await fetch(apiUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch wiki images: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.query || !data.query.allimages) {
      return []
    }

    return data.query.allimages.map((image: any) => {
      let url = image.url

      // Ensure URL has https:// prefix if it's a wikia.nocookie.net URL
      if (url.includes("static.wikia.nocookie.net") && url.startsWith("//")) {
        url = "https:" + url
      }

      return url
    })
  } catch (error) {
    console.error(`Error fetching images for ${wiki}:`, error)
    throw error
  }
})
