"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type WatchType = "ALL" | "ANIME" | "MANGA"

export interface FiltersState {
  type: WatchType
  genre: string | "ALL"
  sort: "rating_desc" | "rating_asc" | "added_desc" | "added_asc"
}

export function Filters({
  genres,
  value,
  onChange,
}: {
  genres: string[]
  value: FiltersState
  onChange: (v: FiltersState) => void
}) {
  const allGenres = ["ALL", ...Array.from(new Set(genres)).sort()]

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
      <div className="flex gap-1 sm:gap-2 justify-center sm:justify-start">
        <Button
          variant={value.type === "ALL" ? "default" : "outline"}
          onClick={() => onChange({ ...value, type: "ALL" })}
          size="sm"
          className="text-xs sm:text-sm"
        >
          All
        </Button>
        <Button
          variant={value.type === "ANIME" ? "default" : "outline"}
          onClick={() => onChange({ ...value, type: "ANIME" })}
          size="sm"
          className="text-xs sm:text-sm"
        >
          Anime
        </Button>
        <Button
          variant={value.type === "MANGA" ? "default" : "outline"}
          onClick={() => onChange({ ...value, type: "MANGA" })}
          size="sm"
          className="text-xs sm:text-sm"
        >
          Manga
        </Button>
      </div>

      <div className="flex gap-2 sm:gap-3">
        <Select value={value.genre} onValueChange={(g) => onChange({ ...value, genre: g as any })}>
          <SelectTrigger className="w-full sm:w-[140px] md:w-[180px] text-xs sm:text-sm h-8 sm:h-9">
            <SelectValue placeholder="Genre" />
          </SelectTrigger>
          <SelectContent>
            {allGenres.map((g) => (
              <SelectItem value={g} key={g} className="text-xs sm:text-sm">
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value.sort} onValueChange={(s) => onChange({ ...value, sort: s as any })}>
          <SelectTrigger className="w-full sm:w-[160px] md:w-[220px] text-xs sm:text-sm h-8 sm:h-9">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating_desc" className="text-xs sm:text-sm">Rating: High → Low</SelectItem>
            <SelectItem value="rating_asc" className="text-xs sm:text-sm">Rating: Low → High</SelectItem>
            <SelectItem value="added_desc" className="text-xs sm:text-sm">Newest</SelectItem>
            <SelectItem value="added_asc" className="text-xs sm:text-sm">Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
