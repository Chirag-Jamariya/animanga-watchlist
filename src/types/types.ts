export type WatchType = "ANIME" | "MANGA"

export interface WatchlistItem {
  id: number
  type: WatchType
  title: string
  poster_url: string
  rating: number | null
  genres: string[]
  characters: string[]
  description: string
  added_at: string
  progress?: number | null
  user_rating?: number | null
  total_episodes?: number | null
  total_chapters?: number | null
}
