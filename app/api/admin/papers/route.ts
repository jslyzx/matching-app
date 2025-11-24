import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const [rows] = await pool.query('SELECT * FROM papers ORDER BY updated_at DESC')
    return NextResponse.json({ papers: rows })
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, grade, subject, total_points } = body
    const [result] = await pool.query(
      'INSERT INTO papers (title, description, grade, subject, total_points) VALUES (?, ?, ?, ?, ?)',
      [title, description || null, grade || null, subject || null, total_points || 0]
    )
    return NextResponse.json({ id: (result as any).insertId })
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
