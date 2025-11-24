import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const [papers] = await pool.query('SELECT * FROM papers WHERE id = ?', [id])
    if (!Array.isArray(papers) || (papers as any[]).length === 0) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    const [items] = await pool.query(
      'SELECT pi.*, q.title AS question_title, q.question_type FROM paper_items pi JOIN questions q ON q.id = pi.question_id WHERE paper_id = ? ORDER BY display_order',
      [id]
    )
    return NextResponse.json({ paper: (papers as any[])[0], items })
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const { title, description, grade, subject, total_points } = body
    await pool.query(
      'UPDATE papers SET title = COALESCE(?, title), description = ?, grade = ?, subject = ?, total_points = COALESCE(?, total_points), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, description || null, grade || null, subject || null, total_points, id]
    )
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await pool.query('DELETE FROM papers WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
