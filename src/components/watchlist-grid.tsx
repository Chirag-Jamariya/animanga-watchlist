"use client"

import useSWR from "swr"
import { useEffect, useMemo, useState, useTransition } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ItemDetailsModal } from "./item-details-modal"
import type { WatchlistItem } from "@/types/types"
import type { FiltersState } from "./filters"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function getTotals(item: WatchlistItem) {
  const anyItem = item as any
  const totalEpisodes = item.total_episodes ?? anyItem.episodes ?? anyItem.totalEpisodes ?? null
  // Prioritize chapters field from API, fallback to total_chapters from DB
  const totalChapters = anyItem.chapters ?? item.total_chapters ?? anyItem.totalChapters ?? anyItem.volumes ?? null
  return { totalEpisodes, totalChapters }
}

function ProgressEditor({ item, onSaved }: { item: WatchlistItem; onSaved: () => void }) {
  const { totalEpisodes, totalChapters } = getTotals(item)
  const label = item.type === "ANIME" ? "Episode" : "Chapter"
  const max =
    item.type === "ANIME"
      ? typeof totalEpisodes === "number"
        ? totalEpisodes
        : undefined
      : typeof totalChapters === "number"
        ? totalChapters
        : undefined

  const [value, setValue] = useState<number>(typeof item.progress === "number" ? item.progress : 0)
  const [isPending, startTransition] = useTransition()

  const clamp = (n: number) => {
    const upper = typeof max === "number" ? max : Number.POSITIVE_INFINITY
    return Math.max(0, Math.min(n, upper))
  }

  const submit = (next: number) => {
    const clamped = clamp(next)
    setValue(clamped)
    startTransition(async () => {
      try {
        const res = await fetch("/api/watchlist/progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id, progress: clamped }),
        })
        const contentType = res.headers.get("content-type") || ""
        let payload: any = null
        if (contentType.includes("application/json")) {
          payload = await res.json()
        } else {
          const text = await res.text()
          payload = { error: text }
        }
        if (!res.ok || payload?.error) {
          console.log("[v0] Progress update failed:", payload?.error || res.statusText)
        } else {
          onSaved()
        }
      } catch (e: any) {
        console.log("[v0] Progress update error:", e?.message)
      }
    })
  }

  // Calculate progress percentage
  const progressPercentage = typeof max === "number" && max > 0 ? Math.round((value / max) * 100) : 0

  return (
    <div
      className="mt-3 space-y-2"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Progress display with total - identical formatting for both */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {item.type === "ANIME" ? "Episodes" : "Chapters"} Progress
        </span>
        {typeof max === "number" && (
          <span className="text-xs text-muted-foreground">
            {progressPercentage}% complete
          </span>
        )}
      </div>
      
      {/* Current progress display - identical formatting for both */}
      <div className="text-sm text-muted-foreground">
        {typeof max === "number" ? (
          <span className="font-medium text-foreground">
            {value} / {max} {item.type === "ANIME" ? "episodes" : "chapters"}
          </span>
        ) : (
          <span className="font-medium text-foreground">
            {value} {item.type === "ANIME" ? "episodes" : "chapters"} watched
          </span>
        )}
      </div>

      {/* Progress controls */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => submit(value - 1)}
          disabled={isPending || value <= 0}
          aria-label={`Decrease ${label}`}
          className="h-8 w-8 sm:h-9 sm:w-9 text-sm"
        >
          -
        </Button>
        <Input
          type="number"
          min={0}
          max={typeof max === "number" ? max : undefined}
          step={1}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value)
            setValue(Number.isNaN(n) ? 0 : clamp(n))
          }}
          onBlur={() => submit(value)}
          className="w-16 sm:w-20 h-8 sm:h-9 text-center text-sm"
          aria-label={`${label} number`}
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => submit(value + 1)}
          disabled={isPending || (typeof max === "number" && value >= max)}
          aria-label={`Increase ${label}`}
          className="h-8 w-8 sm:h-9 sm:w-9 text-sm"
        >
          +
        </Button>
        {typeof max === "number" && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => submit(max)}
            disabled={isPending || value >= max}
            className="h-8 sm:h-9 px-2 text-xs"
          >
            Complete
          </Button>
        )}
      </div>

      {/* Progress bar for visual feedback - identical for both anime and manga */}
      {typeof max === "number" && max > 0 && (
        <div className="w-full bg-secondary/20 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              progressPercentage === 100 
                ? 'bg-green-500' 
                : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}
    </div>
  )
}

function RatingEditor({ item, onSaved }: { item: WatchlistItem; onSaved: () => void }) {
  const [val, setVal] = useState<number | "">(typeof item.user_rating === "number" ? item.user_rating : "")
  const [isPending, start] = useTransition()

  const clamp100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

  const save = (next: number | "") => {
    start(async () => {
      try {
        const payloadVal = next === "" ? null : clamp100(next as number)
        const res = await fetch("/api/watchlist/rating", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id, user_rating: payloadVal }),
        })
        const isJson = (res.headers.get("content-type") || "").includes("application/json")
        const payload = isJson ? await res.json() : { error: await res.text() }
        if (!res.ok || payload?.error) {
          console.log("[v0] Save rating failed:", payload?.error || res.statusText)
        } else {
          onSaved()
        }
      } catch (e: any) {
        console.log("[v0] Save rating error:", e?.message)
      }
    })
  }

  return (
    <div
      className="mt-2 flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <span className="text-sm text-muted-foreground">Your rating</span>
      <Input
        type="number"
        min={0}
        max={100}
        step={1}
        value={val}
        onChange={(e) => {
          const n = e.target.value === "" ? "" : clamp100(Number(e.target.value))
          setVal(n as number | "")
        }}
        onBlur={() => save(val)}
        className="w-20 h-9"
        aria-label="Your rating 0 to 100"
        disabled={isPending}
      />
    </div>
  )
}

export function WatchlistGrid({ filters }: { filters: FiltersState }) {
  const params = useMemo(() => {
    const sp = new URLSearchParams()
    if (filters.type !== "ALL") sp.set("type", filters.type)
    if (filters.genre !== "ALL") sp.set("genre", filters.genre)
    sp.set("sort", filters.sort)
    return sp.toString()
  }, [filters])

  const { data, mutate, isLoading } = useSWR(`/api/watchlist?${params}`, fetcher, {
    revalidateOnFocus: false,
  })

  const items: WatchlistItem[] = data?.items ?? []

  const [selected, setSelected] = useState<WatchlistItem | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const channel = supabase
      .channel("watchlist_items_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "watchlist_items" }, () => {
        mutate()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [mutate])

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="w-full h-40 sm:h-48 md:h-56" />
        ))}
      </div>
    )
  }

  return (
    <>
      <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
        {items.map((item) => (
          <motion.div layout key={item.id}>
            <Card
              className="overflow-hidden h-full cursor-pointer transition-transform hover:scale-105 active:scale-95"
              role="button"
              tabIndex={0}
              aria-label={`View details for ${item.title}`}
              onClick={() => {
                setSelected(item)
                setOpen(true)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  setSelected(item)
                  setOpen(true)
                }
              }}
            >
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={item.poster_url || "/placeholder.svg?height=224&width=160&query=poster"}
                    alt={`${item.title} poster`}
                    className="w-full h-40 sm:h-48 md:h-56 object-cover"
                  />
                  <div className="absolute top-1 sm:top-2 left-1 sm:left-2">
                    <Badge variant={item.type === "ANIME" ? "default" : "secondary"} className="text-xs">
                      {item.type}
                    </Badge>
                  </div>
                  <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      aria-label={`Remove ${item.title}`}
                      onClick={async (e) => {
                        e.stopPropagation()
                        try {
                          const res = await fetch("/api/watchlist", {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: item.id }),
                          })
                          const isJson = (res.headers.get("content-type") || "").includes("application/json")
                          const payload = isJson ? await res.json() : { error: await res.text() }
                          if (!res.ok || payload?.error) {
                            console.log("[v0] Delete failed:", payload?.error || res.statusText)
                          } else {
                            mutate()
                          }
                        } catch (err: any) {
                          console.log("[v0] Delete error:", err?.message)
                        }
                      }}
                      className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-xs"
                    >
                      ×
                    </Button>
                  </div>
                  {/* Progress badge - identical for both anime and manga */}
                  {(() => {
                    const anyItem = item as any
                    const totalEpisodes = item.total_episodes ?? anyItem.episodes ?? anyItem.totalEpisodes ?? null
                    // Prioritize chapters field from API for manga
                    const totalChapters = anyItem.chapters ?? item.total_chapters ?? anyItem.totalChapters ?? anyItem.volumes ?? null
                    const current = Math.max(0, Number(item.progress ?? 0))

                    const isAnime = item.type === "ANIME"
                    const total = isAnime ? totalEpisodes : totalChapters
                    const label = isAnime ? "Ep" : "Ch"
                    
                    return (
                      <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2">
                        <Badge variant="secondary" className="bg-black/70 text-white border-0 text-xs">
                          {typeof total === "number" && total > 0 
                            ? `${label} ${Math.min(current, total)} / ${total}` 
                            : `${label} ${current}`
                          }
                        </Badge>
                      </div>
                    )
                  })()}

                  {/* Progress bar overlay - identical for both anime and manga */}
                  {(() => {
                    const anyItem = item as any
                    const totalEpisodes = item.total_episodes ?? anyItem.episodes ?? anyItem.totalEpisodes ?? null
                    // Prioritize chapters field from API for manga
                    const totalChapters = anyItem.chapters ?? item.total_chapters ?? anyItem.totalChapters ?? anyItem.volumes ?? null
                    const current = Math.max(0, Number(item.progress ?? 0))
                    
                    const isAnime = item.type === "ANIME"
                    const total = isAnime ? totalEpisodes : totalChapters
                    
                    // Always show progress bar when there's progress, regardless of having total
                    if (current > 0) {
                      const hasTotal = typeof total === "number" && total > 0
                      const progressPercentage = hasTotal ? Math.min((current / total) * 100, 100) : 20
                      const isComplete = hasTotal && current >= total
                      
                      return (
                        <div className="absolute bottom-0 left-0 right-0">
                          {/* Progress bar background */}
                          <div className="h-1.5 bg-black/40">
                            {/* Progress bar fill - same color for both when no total */}
                            <div 
                              className={`h-full transition-all duration-300 ${
                                isComplete 
                                  ? 'bg-green-500' 
                                  : hasTotal
                                    ? 'bg-blue-500'  // Same blue color for both when we have total
                                    : 'bg-blue-400'  // Same muted blue when no total
                              } ${!hasTotal ? 'animate-pulse' : ''}`}
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                          {/* Completion indicator */}
                          {isComplete && (
                            <div className="absolute -top-8 right-2">
                              <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
                                ✓ Complete
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    }
                    
                    return null
                  })()}
                </div>
                <div className="p-2 sm:p-3">
                  <p className="font-medium text-pretty text-sm sm:text-base truncate">{item.title}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.genres.slice(0, 2).map((g: string) => (
                      <Badge key={g} variant="outline" className="text-xs">
                        {g}
                      </Badge>
                    ))}
                    {item.genres.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{item.genres.length - 2}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
                    {item.rating != null ? `Rating: ${item.rating}` : "No rating"}{" "}
                    {typeof item.user_rating === "number" ? `• Your: ${item.user_rating}` : ""}
                  </div>
                  <RatingEditor item={item} onSaved={() => mutate()} />
                  <ProgressEditor item={item} onSaved={() => mutate()} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <ItemDetailsModal
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) setSelected(null)
        }}
        item={selected}
      />
    </>
  )
}
