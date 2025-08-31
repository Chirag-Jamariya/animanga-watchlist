import { NextResponse } from "next/server"
import { anilistFetch, SEARCH_QUERY, type MediaType } from "@/lib/anilist"

export async function POST(req: Request) {
  try {
    const { search, type } = (await req.json()) as { search: string; type: MediaType }
    if (!search || !type) {
      return NextResponse.json({ error: "Missing search or type" }, { status: 400 })
    }
    const data = await anilistFetch<any>(SEARCH_QUERY, { search, type })
    const results = data?.data?.Page?.media ?? []
    return NextResponse.json({ results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Search failed" }, { status: 500 })
  }
}
