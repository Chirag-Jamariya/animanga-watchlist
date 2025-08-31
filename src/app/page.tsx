"use client"

import { SearchBar } from "@/components/search-bar"
import { WatchlistGrid } from "@/components/watchlist-grid"
import { Filters, type FiltersState } from "@/components/filters"
import { Suspense, useMemo, useState } from "react"
import useSWR from "swr"
import RandomModalComponent from "@/components/random-modal"

// Colors: primary = sky-600; neutrals = white, gray-100/700; accent = amber-500
// Typography: default system (Geist via default project), single family for headings/body.

export default function Page() {
  const initial: FiltersState = {
    type: "ALL",
    genre: "ALL",
    sort: "added_desc",
  }

  // Stateful client wrapper will live inside each component; this is an RSC shell.
  return (
    <main className="container mx-auto max-w-6xl p-3 sm:p-4 md:p-6">
      <header className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-balance">
          Community Anime & Manga Watchlist
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Search AniList, add to the public watchlist, and get random recommendations.
        </p>
      </header>

      <section className="mb-4 sm:mb-6">
        <SearchBar />
      </section>

      <ClientFiltersAndGrid initial={initial} />
    </main>
  )
}

function ClientFiltersAndGrid({ initial }: { initial: FiltersState }) {
  const [filters, setFilters] = useState<FiltersState>(initial)

  // derive available genres from the current dataset (SWR static call for all items)
  const { data } = useSWR("/api/watchlist?sort=added_desc", (url) => fetch(url).then((r) => r.json()))
  const genres: string[] = useMemo(() => {
    const all = (data?.items ?? []).flatMap((i: any) => i.genres || []) as string[]
    return Array.from(new Set(all)).sort()
  }, [data])

  return (
    <>
      <section className="mb-3 sm:mb-4">
        <Filters genres={genres} value={filters} onChange={setFilters} />
      </section>

      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
          <h2 className="text-base sm:text-lg font-medium">Watchlist</h2>
          <RandomModalComponent />
        </div>
        <Suspense>
          <WatchlistGrid filters={filters} />
        </Suspense>
      </section>
    </>
  )
}
