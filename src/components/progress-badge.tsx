import { cn } from "@/lib/utils"
import type { WatchlistItem } from "@/types"

type AnyItem = WatchlistItem | {
  type?: string
  // current progress
  currentEpisode?: number
  current_episode?: number
  currentChapter?: number
  current_chapter?: number
  progress?: number
  episodesWatched?: number
  chaptersRead?: number
  // totals
  totalEpisodes?: number | null
  total_episodes?: number | null
  totalChapters?: number | null
  total_chapters?: number | null
  episodes?: number | null
  chapters?: number | null
  volumes?: number | null
}

export default function ProgressBadge({
  item,
  className,
}: {
  item: AnyItem
  className?: string
}) {
  const rawType = (item?.type || "").toString().toUpperCase()
  const isAnime = rawType.includes("ANIME")

  // derive current progress
  const current = isAnime
    ? coalesceNumber(
        (item as any).currentEpisode, 
        (item as any).current_episode, 
        item.progress, 
        (item as any).episodesWatched, 
        0
      )
    : coalesceNumber(
        (item as any).currentChapter, 
        (item as any).current_chapter, 
        item.progress, 
        (item as any).chaptersRead, 
        0
      )

  // derive totals with sensible fallbacks
  const total = isAnime
    ? coalesceNumber(
        (item as any).totalEpisodes, 
        (item as any).total_episodes, 
        (item as any).episodes, 
        null
      )
    : coalesceNumber(
        (item as any).totalChapters,
        (item as any).total_chapters,
        (item as any).chapters,
        // final fallback: use volumes if chapters missing
        (item as any).volumes,
        null,
      )

  // clamp current to [0, total] if total is known
  const clampedCurrent =
    typeof total === "number" && Number.isFinite(total)
      ? Math.max(0, Math.min(current ?? 0, total))
      : Math.max(0, current ?? 0)

  const label = isAnime ? "Ep" : "Ch"

  if (clampedCurrent == null && total == null) return null

  // Calculate completion status
  const isComplete = typeof total === "number" && clampedCurrent >= total
  const progressPercentage = typeof total === "number" && total > 0 ? Math.round((clampedCurrent / total) * 100) : 0

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] leading-4",
        isComplete 
          ? "bg-green-500/20 text-green-700 dark:text-green-400" 
          : "bg-muted text-muted-foreground",
        className,
      )}
      aria-label={`${label} ${clampedCurrent ?? 0}${typeof total === "number" ? ` of ${total}` : ""}`}
      title={typeof total === "number" ? `${progressPercentage}% complete` : undefined}
    >
      <span className="font-medium">{label}</span>
      <span className="tabular-nums">
        {clampedCurrent ?? 0}
        {typeof total === "number" ? <span className="opacity-70">{` / ${total}`}</span> : null}
      </span>
      {isComplete && <span className="text-[10px]">✓</span>}
    </div>
  )
}

function coalesceNumber<T extends number | null | undefined>(...vals: (T | number | null)[]): number | null {
  for (const v of vals) {
    if (typeof v === "number" && Number.isFinite(v)) return v
  }
  return null
}
