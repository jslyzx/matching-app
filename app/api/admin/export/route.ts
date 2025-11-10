import { NextResponse } from "next/server"
import { pool } from "@/lib/db"
import * as XLSX from "xlsx"

export async function GET() {
  try {
    // Fetch all questions
    const [questions] = await pool.query("SELECT * FROM questions ORDER BY id")

    // Fetch all items
    const [items] = await pool.query("SELECT * FROM question_items ORDER BY question_id, side, display_order")

    // Prepare data for Excel
    const excelData: any[] = []

    for (const question of questions as any[]) {
      const questionItems = (items as any[]).filter((item) => item.question_id === question.id)
      const leftItems = questionItems.filter((item) => item.side === "left")
      const rightItems = questionItems.filter((item) => item.side === "right")

      // Add question header row
      excelData.push({
        题目ID: question.id,
        标题: question.title,
        描述: question.description,
        难度: question.difficulty_level === "easy" ? "简单" : question.difficulty_level === "medium" ? "中等" : question.difficulty_level === "error_prone" ? "易错题" : "困难",
        年级: question.grade === "grade1" ? "一年级" : question.grade === "grade2" ? "二年级" : question.grade === "grade3" ? "三年级" : question.grade === "grade4" ? "四年级" : question.grade === "grade5" ? "五年级" : question.grade === "grade6" ? "六年级" : "",
        科目: question.subject === "math" ? "数学" : question.subject === "chinese" ? "语文" : question.subject === "english" ? "英语" : question.subject === "science" ? "科学" : "",
        状态: question.is_active ? "启用" : "禁用",
        创建时间: new Date(question.created_at).toLocaleString("zh-CN"),
        左侧项: "",
        右侧项: "",
        匹配关系: "",
      })

      // Add items rows
      const maxLength = Math.max(leftItems.length, rightItems.length)
      for (let i = 0; i < maxLength; i++) {
        const leftItem = leftItems[i]
        const rightItem = rightItems[i]
        const matchedRight = leftItem ? rightItems.find((r) => r.id === leftItem.match_item_id) : null

        excelData.push({
          题目ID: "",
          标题: "",
          描述: "",
          难度: "",
          状态: "",
          创建时间: "",
          左侧项: leftItem ? leftItem.content : "",
          右侧项: rightItem ? rightItem.content : "",
          匹配关系: leftItem && matchedRight ? `${leftItem.content} → ${matchedRight.content}` : "",
        })
      }

      // Add empty row between questions
      excelData.push({
        题目ID: "",
        标题: "",
        描述: "",
        难度: "",
        状态: "",
        创建时间: "",
        左侧项: "",
        右侧项: "",
        匹配关系: "",
      })
    }

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "题目列表")

    // Set column widths
    worksheet["!cols"] = [
      { wch: 8 }, // 题目ID
      { wch: 20 }, // 标题
      { wch: 30 }, // 描述
      { wch: 8 }, // 难度
      { wch: 8 }, // 状态
      { wch: 20 }, // 创建时间
      { wch: 25 }, // 左侧项
      { wch: 25 }, // 右侧项
      { wch: 40 }, // 匹配关系
    ]

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    // Return as downloadable file
    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="questions_${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Failed to export:", error)
    return NextResponse.json({ error: "Failed to export" }, { status: 500 })
  }
}
