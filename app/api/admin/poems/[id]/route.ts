import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 获取单个古诗详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    const query = `
      SELECT * FROM poems WHERE id = ?
    `
    
    const [rows] = await db.query(query, [id])
    const poems = rows as any[]
    
    if (poems.length === 0) {
      return NextResponse.json(
        { error: '古诗不存在' },
        { status: 404 }
      )
    }
    
    const poem = poems[0]
    // 解析 JSON 字段
    if (poem.content_lines && typeof poem.content_lines === 'string') {
      try {
        poem.content_lines = JSON.parse(poem.content_lines)
      } catch {
        poem.content_lines = []
      }
    }
    
    return NextResponse.json(poem)
  } catch (error) {
    console.error('获取古诗详情失败:', error)
    return NextResponse.json(
      { error: '获取古诗详情失败' },
      { status: 500 }
    )
  }
}

// 更新古诗
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { title, author, dynasty, genre, content, content_lines, is_active } = body
    
    if (!title || !author || !dynasty || !content) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      )
    }
    
    // 检查古诗是否存在
    const checkQuery = 'SELECT id FROM poems WHERE id = ?'
    const [existingRows] = await db.query(checkQuery, [id])
    
    if ((existingRows as any[]).length === 0) {
      return NextResponse.json(
        { error: '古诗不存在' },
        { status: 404 }
      )
    }
    
    const updateQuery = `
      UPDATE poems 
      SET title = ?, author = ?, dynasty = ?, genre = ?, 
          content = ?, content_lines = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    
    const contentLinesJson = content_lines ? JSON.stringify(content_lines) : null
    
    await db.query(updateQuery, [
      title,
      author,
      dynasty,
      genre || '其他',
      content,
      contentLinesJson,
      is_active !== undefined ? is_active : true,
      id
    ])
    
    return NextResponse.json({
      message: '古诗更新成功'
    })
  } catch (error) {
    console.error('更新古诗失败:', error)
    return NextResponse.json(
      { error: '更新古诗失败' },
      { status: 500 }
    )
  }
}

// 删除古诗
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // 检查古诗是否存在
    const checkQuery = 'SELECT id FROM poems WHERE id = ?'
    const [existingRows] = await db.query(checkQuery, [id])
    
    if ((existingRows as any[]).length === 0) {
      return NextResponse.json(
        { error: '古诗不存在' },
        { status: 404 }
      )
    }
    
    const deleteQuery = 'DELETE FROM poems WHERE id = ?'
    await db.query(deleteQuery, [id])
    
    return NextResponse.json({
      message: '古诗删除成功'
    })
  } catch (error) {
    console.error('删除古诗失败:', error)
    return NextResponse.json(
      { error: '删除古诗失败' },
      { status: 500 }
    )
  }
}