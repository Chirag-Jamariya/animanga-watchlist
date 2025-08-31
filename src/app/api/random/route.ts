import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")

    const supabase = getSupabaseServerClient()
    let q = supabase.from("watchlist_items").select("id")
    if (type && (type === "ANIME" || type === "MANGA")) {
      q = q.eq("type", type)
    }
    const { data: ids, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: "No items in watchlist" }, { status: 404 })
    }
    const choice = ids[Math.floor(Math.random() * ids.length)].id
    const { data: rows, error: itemErr } = await supabase.from("watchlist_items").select("*").eq("id", choice).limit(1)
    if (itemErr) return NextResponse.json({ error: itemErr.message }, { status: 500 })
    return NextResponse.json({ item: rows?.[0] || null })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Random failed" }, { status: 500 })
  }
}
