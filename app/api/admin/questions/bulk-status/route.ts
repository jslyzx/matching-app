import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const isActive = body?.is_active === true
    const [result] = await pool.query("UPDATE questions SET is_active = ?", [isActive ? 1 : 0])
    return NextResponse.json({ success: true, affectedRows: (result as any).affectedRows || 0 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
  }
}
