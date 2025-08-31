"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

type WatchType = "ALL" | "ANIME" | "MANGA"

function RandomModal() {
  const [open, setOpen] = useState(false)
  const [item, setItem] = useState<any>(null)
  const [loading, setLoading] = useState<WatchType | null>(null)

  async function getRandom(type: WatchType) {
    setLoading(type)
    const params = new URLSearchParams()
    if (type !== "ALL") params.set("type", type)
    const res = await fetch(`/api/random?${params}`)
    const json = await res.json()
    setLoading(null)
    if (!res.ok) return
    setItem(json.item)
    setOpen(true)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
      <Button 
        onClick={() => getRandom("ALL")} 
        disabled={loading !== null}
        size="sm"
        className="text-xs sm:text-sm h-7 sm:h-8"
      >
        {loading === "ALL" ? "Picking..." : "Random"}
      </Button>
      <Button 
        variant="secondary" 
        onClick={() => getRandom("ANIME")} 
        disabled={loading !== null}
        size="sm"
        className="text-xs sm:text-sm h-7 sm:h-8"
      >
        {loading === "ANIME" ? "Picking..." : "Anime"}
      </Button>
      <Button 
        variant="outline" 
        onClick={() => getRandom("MANGA")} 
        disabled={loading !== null}
        size="sm"
        className="text-xs sm:text-sm h-7 sm:h-8"
      >
        {loading === "MANGA" ? "Picking..." : "Manga"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-xl max-h-[80vh] overflow-y-auto">
          {item ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-pretty text-sm sm:text-base pr-8">{item.title}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3 sm:gap-4">
                <img
                  src={item.poster_url || "/placeholder.svg"}
                  alt={`${item.title} poster`}
                  className="sm:col-span-1 w-20 sm:w-full h-30 sm:h-full object-cover rounded mx-auto sm:mx-0"
                />
                <div className="sm:col-span-2 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="text-xs">{item.type}</Badge>
                    {item.rating != null ? (
                      <span className="text-xs text-muted-foreground">Rating: {item.rating}</span>
                    ) : null}
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-pretty">
                    {item.description?.replace(/<[^>]+>/g, "")}
                  </p>
                  {Array.isArray(item.characters) && item.characters.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-medium">Main Characters</p>
                      <div className="flex flex-wrap gap-1">
                        {item.characters.slice(0, 5).map((c: string) => (
                          <Badge key={c} variant="outline" className="text-xs">
                            {c}
                          </Badge>
                        ))}
                        {item.characters.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{item.characters.length - 5}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm">
              No item found.
            </motion.p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function RandomModalComponent() {
  return <RandomModal />
}
