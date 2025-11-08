import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

// GET single question with items or options
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: questionId } = await params

    // Get question details
    const [questions] = await pool.query("SELECT * FROM questions WHERE id = ?", [questionId])

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    const question = questions[0] as any
    const responseData: any = {
      question,
      items: [],
      options: []
    }

    // 根据题目类型获取不同的数据
    if (question.question_type === 'choice') {
      // 获取选择题选项
      const [options] = await pool.query(
        "SELECT * FROM choice_options WHERE question_id = ? ORDER BY display_order",
        [questionId]
      )
      responseData.options = options || []
    } else {
      // 获取连线题项目
      const [items] = await pool.query(
        "SELECT * FROM question_items WHERE question_id = ? ORDER BY display_order",
        [questionId]
      )
      responseData.items = items || []
    }

    return NextResponse.json(responseData)
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
    const { title, description, difficulty_level, is_active, question_type, items, options } = body

    // Update question with only provided fields
    let updateFields = []
    let updateValues: any[] = []
    
    if (title !== undefined) {
      updateFields.push("title = ?")
      updateValues.push(title)
    }
    if (description !== undefined) {
      updateFields.push("description = ?")
      updateValues.push(description)
    }
    if (difficulty_level !== undefined) {
      updateFields.push("difficulty_level = ?")
      updateValues.push(difficulty_level)
    }
    if (is_active !== undefined) {
      updateFields.push("is_active = ?")
      updateValues.push(is_active ? 1 : 0)
    }
    if (question_type !== undefined) {
      updateFields.push("question_type = ?")
      updateValues.push(question_type)
    }
    
    updateFields.push("updated_at = NOW()")
    updateValues.push(questionId)
    
    await pool.query(
      `UPDATE questions SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues
    )

    // 如果只是更新状态，不需要处理items或options
    if (Object.keys(body).length === 1 && body.hasOwnProperty('is_active')) {
      return NextResponse.json({ success: true })
    }

    // 处理选择题选项
    if (options && options.length > 0) {
      // 删除旧的选项
      await pool.query("DELETE FROM choice_options WHERE question_id = ?", [questionId])
      
      // 插入新选项
      for (const option of options) {
        await pool.query(
          "INSERT INTO choice_options (question_id, content, is_correct, display_order) VALUES (?, ?, ?, ?)",
          [questionId, option.content, option.is_correct ? 1 : 0, option.display_order]
        )
      }
    }

    // 处理连线题项目
    if (items && items.length > 0) {
      // 删除旧项目
      await pool.query("DELETE FROM question_items WHERE question_id = ?", [questionId])
      
      // 如果是切换到连线题，删除可能存在的选择题数据
      if (question_type === "matching") {
        await pool.query("DELETE FROM choice_options WHERE question_id = ?", [questionId])
      }

      // 创建一个对象来存储所有项目的ID映射
      const itemIds: { [key: string]: number } = {}

      // 插入所有项目并存储ID
      for (const item of items) {
        const [result] = await pool.query(
          "INSERT INTO question_items (question_id, content, side, display_order) VALUES (?, ?, ?, ?)",
          [questionId, item.content, item.side, item.display_order]
        )
        const insertedId = (result as any).insertId
        
        // 存储ID，使用side和display_order作为键
        itemIds[`${item.side}-${item.display_order}`] = insertedId
      }

      // 更新左侧项目的match_item_id
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
