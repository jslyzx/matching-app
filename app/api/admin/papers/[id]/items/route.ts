import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const { items } = body
    await pool.query('DELETE FROM paper_items WHERE paper_id = ?', [id])
    let total = 0
    for (const it of items || []) {
      await pool.query(
        'INSERT INTO paper_items (paper_id, question_id, display_order, points) VALUES (?, ?, ?, ?)',
        [id, it.question_id, it.display_order || 0, it.points || 0]
      )
      total += it.points || 0
    }
    await pool.query('UPDATE papers SET total_points = ? WHERE id = ?', [total, id])
    return NextResponse.json({ success: true, total_points: total })
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
