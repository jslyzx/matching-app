import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET() {
  try {
    const connection = await pool.getConnection()

    try {
      // 检查 questions 表
      const [questions] = await connection.query("SELECT * FROM questions WHERE is_active = 1")
      console.log("[v0] Questions:", questions)

      // 检查 question_items 表
      const [items] = await connection.query("SELECT * FROM question_items ORDER BY question_id, display_order")
      console.log("[v0] Items:", items)

      return NextResponse.json({
        success: true,
        questions,
        items,
        questionCount: (questions as any[]).length,
        itemCount: (items as any[]).length,
      })
    } finally {
      connection.release()
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
