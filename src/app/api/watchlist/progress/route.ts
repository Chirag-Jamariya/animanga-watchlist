import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export async function PATCH(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 400 })
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body.id !== "number" || typeof body.progress !== "number" || body.progress < 0) {
      return NextResponse.json(
        { error: "Invalid payload. Expect { id: number, progress: number >= 0 }" },
        { status: 400 },
      )
    }

    // Use admin client to bypass RLS for updates
    const supabase = getSupabaseAdminClient()

    // Fetch current totals to enforce upper bound
    const { data: existing, error: readErr } = await (supabase as any)
      .from("watchlist_items")
      .select("type,total_episodes,total_chapters")
      .eq("id", body.id)
      .single()

    if (readErr) {
      return NextResponse.json({ error: readErr.message }, { status: 500 })
    }

    const maxAllowed =
      (existing as any)?.type === "ANIME"
        ? ((existing as any)?.total_episodes ?? Number.POSITIVE_INFINITY)
        : ((existing as any)?.total_chapters ?? Number.POSITIVE_INFINITY)

    const clamped = Math.max(0, Math.min(body.progress, maxAllowed))

    // Update progress
    const updateResult = await (supabase as any)
      .from("watchlist_items")
      .update({ progress: clamped })
      .eq("id", body.id)

    if (updateResult.error) {
      return NextResponse.json({ error: updateResult.error.message }, { status: 500 })
    }

    // Fetch the updated item to return it
    const { data: updatedItem, error: fetchError } = await (supabase as any)
      .from("watchlist_items")
      .select("*")
      .eq("id", body.id)
      .single()

    if (fetchError) {
      // Still return success even if we can't fetch the updated item
      return NextResponse.json({ ok: true, progress: clamped })
    }

    return NextResponse.json({ item: updatedItem })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Update failed" }, { status: 500 })
  }
}
