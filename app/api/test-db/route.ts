import pool from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] Testing database connection...")

    // 测试连接
    const connection = await pool.getConnection()
    console.log("[v0] Database connection successful")

    // 测试查询
    const [rows] = await connection.query("SELECT 1 + 1 AS result")
    console.log("[v0] Test query result:", rows)

    // 检查数据库
    const [databases] = await connection.query("SHOW DATABASES")
    console.log("[v0] Available databases:", databases)

    // 检查表
    const [tables] = await connection.query("SHOW TABLES")
    console.log("[v0] Tables in matching_game:", tables)

    // 检查题目数据
    const [questions] = await connection.query("SELECT * FROM questions")
    console.log("[v0] Questions count:", (questions as any[]).length)

    connection.release()

    return NextResponse.json({
      success: true,
      message: "数据库连接成功",
      data: {
        databases,
        tables,
        questionsCount: (questions as any[]).length,
      },
    })
  } catch (error: any) {
    console.error("[v0] Database connection error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
      },
      { status: 500 },
    )
  }
}
