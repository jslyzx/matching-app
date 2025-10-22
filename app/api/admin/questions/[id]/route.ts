import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

// GET single question with items
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: questionId } = await params

    // Get question details
    const [questions] = await pool.query("SELECT * FROM questions WHERE id = ?", [questionId])

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    // Get question items
    const [items] = await pool.query("SELECT * FROM question_items WHERE question_id = ? ORDER BY display_order", [
      questionId,
    ])

    return NextResponse.json({
      question: questions[0],
      items: items || [],
    })
  } catch (error) {
    console.error("Failed to fetch question:", error)
    return NextResponse.json({ error: "Failed to fetch question" }, { status: 500 })
  }
}

// UPDATE question
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: questionId } = await params
    const body = await request.json()
    const { title, description, difficulty_level, is_active, items } = body

    // Update question
    await pool.query(
      "UPDATE questions SET title = ?, description = ?, difficulty_level = ?, is_active = ?, updated_at = NOW() WHERE id = ?",
      [title, description, difficulty_level, is_active ? 1 : 0, questionId],
    )

    // Delete old items
    await pool.query("DELETE FROM question_items WHERE question_id = ?", [questionId])

    // Insert new items
    if (items && items.length > 0) {
      for (const item of items) {
        const [result] = await pool.query(
          "INSERT INTO question_items (question_id, content, side, display_order) VALUES (?, ?, ?, ?)",
          [questionId, item.content, item.side, item.display_order],
        )

        // Store the inserted ID for matching
        if (item.side === "left") {
          item.insertedId = (result as any).insertId
        }
      }

      // Update match_item_id for left items
      for (const item of items) {
        if (item.side === "left" && item.matchIndex !== undefined) {
          const rightItem = items.find((i: any) => i.side === "right" && i.display_order === item.matchIndex)
          if (rightItem && rightItem.insertedId) {
            await pool.query("UPDATE question_items SET match_item_id = ? WHERE id = ?", [
              rightItem.insertedId,
              item.insertedId,
            ])
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update question:", error)
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 })
  }
}

// DELETE question
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: questionId } = await params

    // Delete items first (foreign key constraint)
    await pool.query("DELETE FROM question_items WHERE question_id = ?", [questionId])

    // Delete question
    await pool.query("DELETE FROM questions WHERE id = ?", [questionId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete question:", error)
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 })
  }
}
