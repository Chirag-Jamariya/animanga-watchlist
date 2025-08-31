export const ANILIST_ENDPOINT = "https://graphql.anilist.co"

export type MediaType = "ANIME" | "MANGA"

export const SEARCH_QUERY = `
  query ($search: String, $type: MediaType) {
    Page(page: 1, perPage: 10) {
      media(search: $search, type: $type, sort: SEARCH_MATCH) {
        id
        type
        title {
          romaji
          english
        }
        coverImage {
          large
        }
      }
    }
  }
`

export const DETAILS_QUERY = `
  query ($id: Int) {
    Media(id: $id) {
      id
      type
      title {
        romaji
        english
      }
      coverImage {
        extraLarge
      }
      averageScore
      genres
      description(asHtml: false)
      episodes
      chapters
      volumes
      characters(sort: ROLE, perPage: 5) {
        nodes {
          name {
            full
          }
        }
      }
    }
  }
`

export const TOTALS_QUERY = `
  query ($id: Int) {
    Media(id: $id) {
      id
      type
      episodes
      chapters
      volumes
    }
  }
`

export async function anilistFetch<T>(query: string, variables: Record<string, unknown>) {
  const res = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`AniList error: ${res.status} ${text}`)
  }
  const json = (await res.json()) as T
  return json
}

export async function fetchMediaTotals(args: { id: number; type?: MediaType }) {
  const { id, type } = args
  const res = await anilistFetch<any>(TOTALS_QUERY, { id })
  const m = res?.data?.Media
  if (!m) return { total_episodes: null, total_chapters: null, chapters: null, episodes: null }

  const detectedType: MediaType | undefined = m?.type
  const isAnime = (type || detectedType) === "ANIME"

  const total_episodes = isAnime && typeof m.episodes === "number" ? m.episodes : null
  const total_chapters = !isAnime && typeof m.chapters === "number" ? m.chapters : null

  return { 
    total_episodes, 
    total_chapters,
    // Also return raw data for fallback
    episodes: typeof m.episodes === "number" ? m.episodes : null,
    chapters: typeof m.chapters === "number" ? m.chapters : null
  }
}
