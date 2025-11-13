import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { splitPoemContent } from '@/lib/poems'

// 获取古诗列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const genre = searchParams.get('genre') || ''
    
    const offset = (page - 1) * limit
    
    let whereConditions = []
    let queryParams: any[] = []
    
    if (search) {
      whereConditions.push('(title LIKE ? OR author LIKE ?)')
      queryParams.push(`%${search}%`, `%${search}%`)
    }
    
    if (genre) {
      whereConditions.push('genre = ?')
      queryParams.push(genre)
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : ''
    
    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM poems 
      ${whereClause}
    `
    const [countResult] = await db.query(countQuery, queryParams)
    const total = (countResult as any)[0].total
    
    // 获取分页数据
    const dataQuery = `
      SELECT * 
      FROM poems 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `
    queryParams.push(limit, offset)
    
    const [poems] = await db.query(dataQuery, queryParams)
    
    return NextResponse.json({
      poems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('获取古诗列表失败:', error)
    return NextResponse.json(
      { error: '获取古诗列表失败' },
      { status: 500 }
    )
  }
}

// 创建古诗
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, author, dynasty, genre, content, content_lines, is_active } = body
    
    if (!title || !author || !dynasty || !content) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      )
    }
    
    const query = `
      INSERT INTO poems (title, author, dynasty, genre, content, content_lines, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    
    const lines = Array.isArray(content_lines) && content_lines.length > 0
      ? content_lines
      : splitPoemContent(content, genre)
    const contentLinesJson = lines.length > 0 ? JSON.stringify(lines) : null
    
    const [result] = await db.query(query, [
      title,
      author,
      dynasty,
      genre || '其他',
      content,
      contentLinesJson,
      is_active !== undefined ? is_active : true
    ])
    
    return NextResponse.json({
      id: (result as any).insertId,
      message: '古诗创建成功'
    })
  } catch (error) {
    console.error('创建古诗失败:', error)
    return NextResponse.json(
      { error: '创建古诗失败' },
      { status: 500 }
    )
  }
}
