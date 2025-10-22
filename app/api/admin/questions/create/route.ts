import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, difficulty_level, is_active, items } = body

    // Insert question
    const [result] = await pool.query(
      "INSERT INTO questions (title, description, difficulty_level, is_active) VALUES (?, ?, ?, ?)",
      [title, description, difficulty_level, is_active ? 1 : 0],
    )

    const questionId = (result as any).insertId

    // Insert items
    if (items && items.length > 0) {
      const itemIds: { [key: string]: number } = {}

      // First pass: insert all items
      for (const item of items) {
        const [itemResult] = await pool.query(
          "INSERT INTO question_items (question_id, content, side, display_order) VALUES (?, ?, ?, ?)",
          [questionId, item.content, item.side, item.display_order],
        )
        const insertedId = (itemResult as any).insertId

        // Store ID with a key based on side and order
        itemIds[`${item.side}-${item.display_order}`] = insertedId
      }

      // Second pass: update match_item_id for left items
      for (const item of items) {
        if (item.side === "left" && item.matchIndex !== undefined) {
          const leftId = itemIds[`left-${item.display_order}`]
          const rightId = itemIds[`right-${item.matchIndex}`]

          if (leftId && rightId) {
            await pool.query("UPDATE question_items SET match_item_id = ? WHERE id = ?", [rightId, leftId])
          }
        }
      }
    }

    return NextResponse.json({ success: true, questionId })
  } catch (error) {
    console.error("Failed to create question:", error)
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 })
  }
}
