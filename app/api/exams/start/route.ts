import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const user_id = String(body?.user_id || '').trim()
    const paper_id = Number(body?.paper_id)
    const duration_seconds = Number(body?.duration_seconds || 0)

    if (!user_id || !paper_id || Number.isNaN(paper_id)) {
      return NextResponse.json({ error: 'invalid_params' }, { status: 400 })
    }

    // Ensure tables exist (idempotent)
    await pool.query(`CREATE TABLE IF NOT EXISTS exam_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(100) NOT NULL,
      paper_id INT NOT NULL,
      status ENUM('created','started','submitted') DEFAULT 'created',
      duration_seconds INT DEFAULT 0,
      score INT DEFAULT 0,
      started_at TIMESTAMP NULL,
      submitted_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
      INDEX idx_user_paper (user_id, paper_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`)

    await pool.query(`CREATE TABLE IF NOT EXISTS exam_answers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id INT NOT NULL,
      question_id INT NOT NULL,
      answer_json JSON NOT NULL,
      is_correct BOOLEAN DEFAULT FALSE,
      points_awarded INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE,
      INDEX idx_session_q (session_id, question_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`)

    // Validate paper exists
    const [pRows] = await pool.query('SELECT id FROM papers WHERE id = ?', [paper_id])
    if (!Array.isArray(pRows) || (pRows as any[]).length === 0) {
      return NextResponse.json({ error: 'paper_not_found' }, { status: 404 })
    }

    const [result] = await pool.query(
      'INSERT INTO exam_sessions (user_id, paper_id, status, duration_seconds, started_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [user_id, paper_id, 'started', Number.isFinite(duration_seconds) ? duration_seconds : 0]
    )
    return NextResponse.json({ session_id: (result as any).insertId })
  } catch (e: any) {
    return NextResponse.json({ error: 'failed', details: e?.message || String(e) }, { status: 500 })
  }
}
