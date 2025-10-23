import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET() {
  try {
    console.log("[v0] Attempting to connect to database...")
    const connection = await pool.getConnection()
    console.log("[v0] Database connection successful")

    try {
      // 获取所有题目
      const [questions] = await connection.query(
        "SELECT id, title, description, question_type FROM questions WHERE is_active = 1 ORDER BY id",
      )

      const questionsArray = questions as any[]
      console.log("[v0] Found questions:", questionsArray.length)

      // 为每个题目获取对应的选项
      const questionsWithItems = await Promise.all(
        questionsArray.map(async (question) => {
          // 根据题目类型处理不同的数据
          if (question.question_type === 'choice') {
            // 处理选择题
            const [options] = await connection.query(
              `SELECT id, content, is_correct 
               FROM choice_options 
               WHERE question_id = ? 
               ORDER BY display_order`,
              [question.id],
            )

            const optionsArray = options as any[]
            console.log(`[v0] Choice question ${question.id} has ${optionsArray.length} options`)

            if (optionsArray.length === 0) {
              console.warn(`[v0] Choice question ${question.id} has no options`)
              return null
            }

            return {
              id: question.id,
              title: question.title,
              description: question.description,
              type: 'choice',
              options: optionsArray.map((option) => ({
                id: `option-${option.id}`,
                content: option.content,
                isCorrect: option.is_correct === 1,
              })),
            }
          } else {
            // 处理连线题
            const [items] = await connection.query(
              `SELECT id, content, side, match_item_id 
               FROM question_items 
               WHERE question_id = ? 
               ORDER BY side, display_order`,
              [question.id],
            )

            const itemsArray = items as any[]
            console.log(`[v0] Matching question ${question.id} has ${itemsArray.length} items`)

            // 分离左右两列
            const leftItems = itemsArray
              .filter((item) => item.side === "left")
              .map((item) => ({
                id: `left-${item.id}`,
                text: item.content,
                value: item.match_item_id ? item.match_item_id.toString() : "",
              }))

            const rightItems = itemsArray
              .filter((item) => item.side === "right")
              .map((item) => ({
                id: `right-${item.id}`,
                text: item.content,
                value: item.id.toString(),
              }))

            if (leftItems.length === 0 || rightItems.length === 0) {
              console.warn(
                `[v0] Matching question ${question.id} has incomplete data: ${leftItems.length} left items, ${rightItems.length} right items`,
              )
              return null
            }

            return {
              id: question.id,
              title: question.title,
              type: 'matching',
              leftItems,
              rightItems,
            }
          }
        }),
      )

      // 过滤掉无效的题目
      const validQuestions = questionsWithItems.filter((q) => q !== null)

      console.log("[v0] Successfully processed all questions:", validQuestions.length)
      return NextResponse.json({ questions: validQuestions })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("[v0] Database error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      code: (error as any).code,
      errno: (error as any).errno,
      sqlState: (error as any).sqlState,
    })
    return NextResponse.json(
      {
        error: "Failed to fetch questions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
