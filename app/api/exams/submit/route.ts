import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { session_id, answers } = body
    const [sessionRows] = await pool.query('SELECT * FROM exam_sessions WHERE id = ?', [session_id])
    const session = (sessionRows as any[])[0]
    if (!session) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    const [items] = await pool.query('SELECT pi.*, q.question_type FROM paper_items pi JOIN questions q ON q.id = pi.question_id WHERE paper_id = ?', [session.paper_id])
    let totalScore = 0
    for (const it of items as any[]) {
      const ans = (answers || []).find((a: any) => a.question_id === it.question_id)
      let isCorrect = false
      let pointsAwarded = 0
      if (it.question_type === 'choice') {
        const [optsRows] = await pool.query('SELECT id, is_correct FROM choice_options WHERE question_id = ?', [it.question_id])
        const correctIds = (optsRows as any[]).filter(o => o.is_correct === 1).map(o => `option-${o.id}`)
        const userSel = Array.isArray(ans?.selected) ? ans.selected : []
        const ok = userSel.length === correctIds.length && userSel.every((id: string) => correctIds.includes(id))
        isCorrect = ok
        pointsAwarded = ok ? (it.points || 0) : 0
      }
      totalScore += pointsAwarded
      await pool.query(
        'INSERT INTO exam_answers (session_id, question_id, answer_json, is_correct, points_awarded) VALUES (?, ?, ?, ?, ?)',
        [session_id, it.question_id, JSON.stringify(ans || {}), isCorrect ? 1 : 0, pointsAwarded]
      )
    }
    await pool.query('UPDATE exam_sessions SET status = ?, score = ?, submitted_at = CURRENT_TIMESTAMP WHERE id = ?', ['submitted', totalScore, session_id])
    return NextResponse.json({ score: totalScore })
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
