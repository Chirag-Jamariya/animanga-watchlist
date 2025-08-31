import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const rawType = searchParams.get("type")
    const rawGenre = searchParams.get("genre")
    const sort = searchParams.get("sort") // rating_desc | rating_asc | added_desc | added_asc

    const type = rawType && rawType !== "ALL" ? rawType : null
    const genre = rawGenre && rawGenre !== "ALL" ? rawGenre : null

    const supabase = await getSupabaseServerClient()
    let q = supabase.from("watchlist_items").select("*")

    if (type === "ANIME" || type === "MANGA") {
      q = q.eq("type", type)
    }
    if (genre) {
      q = q.contains("genres", [genre])
    }

    if (sort === "rating_desc") q = q.order("rating", { ascending: false, nullsFirst: true })
    else if (sort === "rating_asc") q = q.order("rating", { ascending: true, nullsFirst: true })
    else if (sort === "added_asc") q = q.order("added_at", { ascending: true })
    else q = q.order("added_at", { ascending: false })

    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ items: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Fetch failed" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = (await req.json()) as { id: number }
    if (!id || typeof id !== "number") {
      return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 })
    }
    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.from("watchlist_items").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Delete failed" }, { status: 500 })
  }
}
