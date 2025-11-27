import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, difficulty_level, grade, subject, is_active, items, type, options, poem_id, hint_enabled, hint_text, image_enabled, image_url, draft_enabled, blanks } = body

    // Insert question
    const [result] = await pool.query(
      "INSERT INTO questions (title, description, difficulty_level, grade, subject, poem_id, hint_enabled, hint_text, image_enabled, image_url, draft_enabled, is_active, question_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [title, description, difficulty_level, grade, subject, poem_id || null, hint_enabled ? 1 : 0, hint_text || null, image_enabled ? 1 : 0, image_url || null, draft_enabled ? 1 : 0, is_active ? 1 : 0, type],
    )

    const questionId = (result as any).insertId

    // 根据题目类型处理不同的数据
    if (type === 'poem_fill') {
      
    } else if (type === 'matching' && items && items.length > 0) {
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
      // 先获取并排序所有right项
      const rightItems = items.filter(i => i.side === 'right').sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      
      for (const item of items) {
        if (item.side === "left" && item.matchIndex !== undefined) {
          // 确保matchIndex是有效的数字且在正确范围内
          const matchIndex = Number(item.matchIndex);
          if (!isNaN(matchIndex) && matchIndex >= 0 && matchIndex < rightItems.length) {
            const leftId = itemIds[`left-${item.display_order}`];
            const targetRightItem = rightItems[matchIndex];
            const rightId = itemIds[`right-${targetRightItem.display_order}`];

            if (leftId && rightId) {
              await pool.query("UPDATE question_items SET match_item_id = ? WHERE id = ?", [rightId, leftId]);
            }
          }
        }
      }
    } else if (type === 'choice' && options && options.length > 0) {
      // 处理选择题选项
      for (const option of options) {
        await pool.query(
          "INSERT INTO choice_options (question_id, content, is_correct, display_order) VALUES (?, ?, ?, ?)",
          [questionId, option.content, option.is_correct ? 1 : 0, option.display_order],
        )
      }
    } else if (type === 'fill_blank' && blanks && blanks.length > 0) {
      const sorted = [...blanks].sort((a: any, b: any) => (a.idx || 0) - (b.idx || 0))
      try {
        for (const b of sorted) {
          await pool.query(
            "INSERT INTO blank_items (question_id, idx, answer_text, hint) VALUES (?, ?, ?, ?)",
            [questionId, b.idx, b.answer_text, b.hint || null]
          )
        }
      } catch (err) {
        // fallback: store in question_items with side='blank'
        for (const b of sorted) {
          await pool.query(
            "INSERT INTO question_items (question_id, content, side, display_order) VALUES (?, ?, 'blank', ?)",
            [questionId, b.answer_text, b.idx]
          )
        }
      }
    }

    return NextResponse.json({ success: true, questionId })
  } catch (error) {
    console.error("Failed to create question:", error)
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 })
  }
}
