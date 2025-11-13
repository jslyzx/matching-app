import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function POST() {
  try {
    const conn = await pool.getConnection()
    try {
      await conn.query(
        "ALTER TABLE questions MODIFY COLUMN question_type ENUM('matching','choice','poem_fill') NOT NULL DEFAULT 'matching' COMMENT '题目类型：matching=连线题, choice=选择题, poem_fill=古诗填空'",
      )
      const [cols] = await conn.query("SHOW COLUMNS FROM questions LIKE 'poem_id'")
      const hasPoemId = Array.isArray(cols) && (cols as any[]).length > 0
      if (!hasPoemId) {
        await conn.query("ALTER TABLE questions ADD COLUMN poem_id INT NULL AFTER subject")
        await conn.query(
          "ALTER TABLE questions ADD CONSTRAINT fk_questions_poem FOREIGN KEY (poem_id) REFERENCES poems(id) ON DELETE SET NULL",
        )
      }
      return NextResponse.json({ success: true })
    } finally {
      conn.release()
    }
  } catch (error) {
    return NextResponse.json({ error: 'migration failed', details: (error as any)?.message }, { status: 500 })
  }
}
