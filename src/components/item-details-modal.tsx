"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { WatchlistItem } from "@/types"

function stripHtml(html?: string) {
  if (!html) return ""
  return html.replace(/<[^>]+>/g, "")
}

export function ItemDetailsModal({
  open,
  onOpenChange,
  item,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  item: WatchlistItem | null
}) {
  if (!item) return null

  const current = Math.max(0, Number(item.progress ?? 0))
  const total = item.type === "ANIME" ? item.total_episodes : item.total_chapters
  const label = item.type === "ANIME" ? "Episodes" : "Chapters"
  const progressPercentage = typeof total === "number" && total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[80vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-pretty text-sm sm:text-base md:text-lg pr-8 leading-tight">
            {item.title}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4">
          {/* Mobile: stacked layout, Desktop: side by side */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <img
              src={item.poster_url || "/placeholder.svg?height=256&width=192&query=poster"}
              alt={`${item.title} poster`}
              className="w-20 sm:w-32 h-30 sm:h-48 object-cover rounded mx-auto sm:mx-0 flex-shrink-0"
            />
            <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
              {/* Type and Rating */}
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <Badge className="text-xs">{item.type}</Badge>
                {item.rating != null && (
                  <span className="text-xs text-muted-foreground">
                    AniList: {item.rating}/100
                  </span>
                )}
                {typeof item.user_rating === "number" && (
                  <span className="text-xs text-muted-foreground">
                    Your: {item.user_rating}/100
                  </span>
                )}
              </div>

            {/* Progress Information */}
            {typeof total === "number" && total > 0 ? (
              <div className="space-y-1 sm:space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm font-medium">{label} Progress</span>
                  <span className="text-xs text-muted-foreground">
                    {current} / {total} ({progressPercentage}%)
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                {progressPercentage === 100 && (
                  <div className="text-xs text-green-600 font-medium">✓ Completed</div>
                )}
              </div>
            ) : current > 0 ? (
              <div className="text-xs sm:text-sm">
                <span className="font-medium">{label} Progress: </span>
                <span className="text-muted-foreground">{current} {label.toLowerCase()}</span>
              </div>
            ) : null}

            {/* Episode/Chapter Count */}
            {typeof total === "number" && (
              <div className="text-xs sm:text-sm">
                <span className="font-medium">Total {label}: </span>
                <span className="text-muted-foreground">{total}</span>
              </div>
            )}

            {/* Genres */}
            {Array.isArray(item.genres) && item.genres.length > 0 && (
              <div className="space-y-1 sm:space-y-2">
                <span className="text-xs sm:text-sm font-medium">Genres</span>
                <div className="flex flex-wrap gap-1">
                  {item.genres.slice(0, 6).map((g) => (
                    <Badge key={g} variant="outline" className="text-xs">
                      {g}
                    </Badge>
                  ))}
                  {item.genres.length > 6 && (
                    <Badge variant="outline" className="text-xs">
                      +{item.genres.length - 6}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Characters */}
            {Array.isArray(item.characters) && item.characters.length > 0 && (
              <div className="space-y-1 sm:space-y-2">
                <span className="text-xs sm:text-sm font-medium">Main Characters</span>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {item.characters.slice(0, 5).join(", ")}
                </div>
              </div>
            )}

            {/* Description */}
            {item.description && (
              <div className="space-y-1 sm:space-y-2">
                <span className="text-xs sm:text-sm font-medium">Description</span>
                <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground text-pretty">
                  {stripHtml(item.description)}
                </p>
              </div>
            )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
