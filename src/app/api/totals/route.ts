import { NextResponse } from "next/server"
import { fetchMediaTotals } from "@/lib/anilist"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const id = Number(body?.id)
    const type = body?.type === "MANGA" ? "MANGA" : "ANIME"
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 })
    }
    const totals = await fetchMediaTotals({ id, type })
    return NextResponse.json({ id, type, totals })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch totals" }, { status: 500 })
  }
}
