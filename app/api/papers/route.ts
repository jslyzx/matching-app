import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET() {
  try {
    const [rows] = await pool.query(
      'SELECT p.id, p.title, p.description, p.grade, p.subject, p.total_points, COUNT(pi.id) AS question_count FROM papers p LEFT JOIN paper_items pi ON pi.paper_id = p.id GROUP BY p.id ORDER BY p.updated_at DESC'
    )
    return NextResponse.json({ papers: rows })
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
