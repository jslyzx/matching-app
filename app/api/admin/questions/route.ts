import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10))
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "10", 10)))
    const keyword = (url.searchParams.get("keyword") || "").trim()
    const type = (url.searchParams.get("type") || "").trim()
    const difficulty = (url.searchParams.get("difficulty") || "").trim()
    const grade = (url.searchParams.get("grade") || "").trim()
    const subject = (url.searchParams.get("subject") || "").trim()
    const isActiveParam = url.searchParams.get("is_active")
    const where: string[] = []
    const params: any[] = []

    if (keyword) {
      where.push("(title LIKE ? OR description LIKE ?)")
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    if (type) {
      where.push("type = ?")
      params.push(type)
    }
    if (difficulty) {
      where.push("difficulty_level = ?")
      params.push(difficulty)
    }
    if (grade) {
      where.push("grade = ?")
      params.push(grade)
    }
    if (subject) {
      where.push("subject = ?")
      params.push(subject)
    }
    if (isActiveParam !== null && isActiveParam !== "") {
      const v = isActiveParam === "1" || isActiveParam === "true" ? 1 : 0
      where.push("is_active = ?")
      params.push(v)
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : ""
    const offset = (page - 1) * pageSize

    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM questions ${whereSql}`, params)
    const total = Array.isArray(countRows) && countRows.length ? (countRows as any)[0].total : 0

    const [rows] = await pool.query(
      `SELECT * FROM questions ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    )

    return NextResponse.json({ questions: rows, total, page, pageSize })
  } catch (error) {
    console.error("Failed to fetch questions:", error)
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
  }
}
