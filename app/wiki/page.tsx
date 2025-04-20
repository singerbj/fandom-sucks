import { redirect } from "next/navigation"

export default function WikiRedirect({
  searchParams,
}: {
  searchParams: { wiki?: string }
}) {
  const wiki = searchParams.wiki

  if (!wiki) {
    redirect("/")
  }

  // Clean the wiki name and redirect to the wiki page
  const cleanWiki = wiki.trim().toLowerCase()
  redirect(`/wiki/${cleanWiki}`)
}
