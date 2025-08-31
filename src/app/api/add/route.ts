import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { anilistFetch, DETAILS_QUERY } from "@/lib/anilist"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

async function getClientIp() {
  const h = await headers()
  const xfwd = h.get("x-forwarded-for") || ""
  const ip = xfwd.split(",")[0].trim() || h.get("x-real-ip") || "unknown"
  return ip
}

const RATE_LIMIT_SECONDS = 60

export async function POST(req: Request) {
  try {
    const { id } = (await req.json()) as { id: number }
    if (!id || typeof id !== "number") {
      return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 })
    }

    const ip = await getClientIp()
    const supabase = getSupabaseAdminClient()

    // Check rate limit
    const { data: existing, error: rlErr } = await (supabase as any)
      .from("rate_limits")
      .select("*")
      .eq("ip_address", ip)
      .order("last_added", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (rlErr) {
      return NextResponse.json({ error: rlErr.message }, { status: 500 })
    }

    if (existing?.last_added) {
      const last = new Date(existing.last_added).getTime()
      const now = Date.now()
      if ((now - last) / 1000 < RATE_LIMIT_SECONDS) {
        const retry = Math.ceil(RATE_LIMIT_SECONDS - (now - last) / 1000)
        return NextResponse.json({ error: `Rate limited. Try again in ${retry}s` }, { status: 429 })
      }
    }

    // Fetch full details
    const detailsRes = await anilistFetch<any>(DETAILS_QUERY, { id })
    const m = detailsRes?.data?.Media
    if (!m) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    const row = {
      id: m.id as number,
      type: m.type as "ANIME" | "MANGA",
      title: (m.title?.english || m.title?.romaji || "").toString(),
      poster_url: (m.coverImage?.extraLarge || "").toString(),
      rating: typeof m.averageScore === "number" ? m.averageScore : null,
      genres: (Array.isArray(m.genres) ? m.genres : []).map(String),
      characters: (m.characters?.nodes || []).map((n: any) => n?.name?.full).filter(Boolean),
      description: (m.description || "").toString(),
      added_at: new Date().toISOString(),
      total_episodes: m.type === "ANIME" && typeof m.episodes === "number" ? m.episodes : null,
      total_chapters: m.type === "MANGA" && typeof m.chapters === "number" ? m.chapters : null,
    }

    // Upsert into watchlist_items
    const { error: upsertErr } = await (supabase as any).from("watchlist_items").upsert(row, { onConflict: "id" })
    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 })
    }

    // Update rate_limits
    const { error: rlUpErr } = await (supabase as any).from("rate_limits").upsert({
      ip_address: ip,
      last_added: new Date().toISOString(),
    })
    if (rlUpErr) {
      // Non-fatal
      console.warn("[v0] Failed to update rate_limits:", rlUpErr.message)
    }

    return NextResponse.json({ ok: true, item: row })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Add failed" }, { status: 500 })
  }
}
