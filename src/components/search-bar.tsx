"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

type MediaType = "ANIME" | "MANGA"

async function safeParseResponse(res: Response): Promise<any> {
  const ct = res.headers.get("content-type") || ""
  const text = await res.text()
  if (ct.includes("application/json")) {
    try {
      return text ? JSON.parse(text) : {}
    } catch (e: any) {
      return { error: e?.message || "Failed to parse JSON" }
    }
  }
  // Not JSON, return as error payload to surface server message
  return { error: text || "Unexpected non-JSON response from server" }
}

const fetcher = async (url: string, body?: any) => {
  const res = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await safeParseResponse(res)
  if (!res.ok || data?.error) {
    const msg = (typeof data?.error === "string" && data.error) || "Request failed"
    throw new Error(msg)
  }
  return data
}

export function SearchBar() {
  const [type, setType] = useState<MediaType>("ANIME")
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  const [addingId, setAddingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Basic debounce without useEffect-fetch (SWR handles fetch)
  useMemo(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 350)
    return () => clearTimeout(t)
  }, [query])

  const { data, isLoading } = useSWR(debounced ? ["/api/search", { search: debounced, type }] : null, ([url, body]) =>
    fetcher(url, body),
  )

  const results = data?.results ?? []

  async function addToWatchlist(id: number) {
    try {
      setError(null)
      setAddingId(id)
      const res = await fetch("/api/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      const data = await safeParseResponse(res)
      if (!res.ok || data?.error) {
        const msg = (typeof data?.error === "string" && data.error) || "Failed to add"
        setError(msg)
        return
      }
      // Optionally show success state or toast here
    } catch (e: any) {
      setError(e?.message || "Something went wrong")
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="w-full rounded-lg border bg-card p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
        <div className="flex-1">
          <Label htmlFor="search" className="text-sm">Search</Label>
          <Input
            id="search"
            placeholder="Search anime or manga..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="mb-2 block text-sm">Type</Label>
          <RadioGroup value={type} onValueChange={(v: MediaType) => setType(v)} className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ANIME" id="anime" />
              <Label htmlFor="anime" className="text-sm">Anime</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="MANGA" id="manga" />
              <Label htmlFor="manga" className="text-sm">Manga</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-3 sm:mt-4">
        <AnimatePresence initial={false}>
          {isLoading ? (
            <motion.p
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-muted-foreground text-sm"
            >
              Searching...
            </motion.p>
          ) : null}
          {results.length > 0 ? (
            <motion.ul
              key="results"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
            >
              {results.map((r: any) => (
                <li key={r.id} className="rounded-md border p-3 flex gap-3">
                  <img
                    src={r.coverImage?.large || "/placeholder.svg"}
                    alt={(r.title?.english || r.title?.romaji || "Poster") + " poster"}
                    className="h-16 sm:h-20 w-12 sm:w-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-pretty text-sm sm:text-base truncate">
                      {r.title?.english || r.title?.romaji}
                    </p>
                    <p className="text-xs text-muted-foreground">{r.type}</p>
                    <Button
                      size="sm"
                      className={cn("mt-2 text-xs h-7")}
                      onClick={() => addToWatchlist(r.id)}
                      disabled={addingId === r.id}
                    >
                      {addingId === r.id ? "Adding..." : "Add to Watchlist"}
                    </Button>
                  </div>
                </li>
              ))}
            </motion.ul>
          ) : debounced && !isLoading ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-muted-foreground text-sm"
            >
              No results found
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}
