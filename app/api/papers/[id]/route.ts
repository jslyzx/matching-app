import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const [papers] = await pool.query('SELECT * FROM papers WHERE id = ?', [id])
    if (!Array.isArray(papers) || (papers as any[]).length === 0) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    const [items] = await pool.query(
      'SELECT pi.*, q.title, q.description, q.question_type FROM paper_items pi JOIN questions q ON q.id = pi.question_id WHERE paper_id = ? ORDER BY display_order',
      [id]
    )
    return NextResponse.json({ paper: (papers as any[])[0], items })
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
