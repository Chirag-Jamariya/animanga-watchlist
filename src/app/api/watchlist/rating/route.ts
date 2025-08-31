import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export async function PATCH(req: Request) {
  try {
    const { id, user_rating } = (await req.json()) as { id: number; user_rating: number | null }
    if (!id || typeof id !== "number") {
      return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 })
    }
    // accept null to clear, or 0-100
    if (user_rating != null && (typeof user_rating !== "number" || user_rating < 0 || user_rating > 100)) {
      return NextResponse.json({ error: "user_rating must be 0-100 or null" }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.from("watchlist_items").update({ user_rating }).eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Update rating failed" }, { status: 500 })
  }
}
