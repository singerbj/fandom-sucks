export interface WikiPage {
  pageid: number
  title: string
  length?: number
}

export interface WikiPageMetadata {
  pageid: number
  title: string
  length?: number
  lastModified?: string
  categories?: string[]
  images?: string[]
  imageNames?: string[] // Added to store original image names
  thumbnail?: string | null
  extract?: string | null
  fullContent?: string | null
}

export interface WikiSearchResult {
  pageid: number
  title: string
  snippet?: string
}
