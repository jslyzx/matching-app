import { db } from './db'

export interface Poem {
  id: number
  title: string
  author: string
  dynasty: string
  genre: string
  content: string
  content_lines: string[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreatePoemData {
  title: string
  author: string
  dynasty: string
  genre?: string
  content: string
  content_lines?: string[]
  is_active?: boolean
}

export interface UpdatePoemData {
  title?: string
  author?: string
  dynasty?: string
  genre?: string
  content?: string
  content_lines?: string[]
  is_active?: boolean
}

export interface PoemFilters {
  search?: string
  genre?: string
  is_active?: boolean
  page?: number
  limit?: number
}

/**
 * 获取古诗列表（带分页和筛选）
 */
export async function getPoems(filters: PoemFilters = {}): Promise<{
  poems: Poem[]
  total: number
  page: number
  limit: number
  totalPages: number
}> {
  const {
    search = '',
    genre = '',
    is_active,
    page = 1,
    limit = 10
  } = filters
  
  const offset = (page - 1) * limit
  
  let whereConditions: string[] = []
  let queryParams: any[] = []
  
  if (search) {
    whereConditions.push('(title LIKE ? OR author LIKE ?)')
    queryParams.push(`%${search}%`, `%${search}%`)
  }
  
  if (genre) {
    whereConditions.push('genre = ?')
    queryParams.push(genre)
  }
  
  if (is_active !== undefined) {
    whereConditions.push('is_active = ?')
    queryParams.push(is_active)
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
  
  const poems = await db.query(dataQuery, queryParams) as Poem[]
  
  // 解析 content_lines JSON
  const processedPoems = poems.map(poem => {
    if (poem.content_lines && typeof poem.content_lines === 'string') {
      try {
        return {
          ...poem,
          content_lines: JSON.parse(poem.content_lines)
        }
      } catch {
        return {
          ...poem,
          content_lines: null
        }
      }
    }
    return poem
  })
  
  return {
    poems: processedPoems,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * 根据ID获取单个古诗
 */
export async function getPoemById(id: number): Promise<Poem | null> {
  const query = 'SELECT * FROM poems WHERE id = ?'
  const [rows] = await db.query(query, [id])
  const poems = rows as Poem[]
  
  if (poems.length === 0) {
    return null
  }
  
  const poem = poems[0]
  
  // 解析 content_lines JSON
  if (poem.content_lines && typeof poem.content_lines === 'string') {
    try {
      return {
        ...poem,
        content_lines: JSON.parse(poem.content_lines)
      }
    } catch {
      return {
        ...poem,
        content_lines: null
      }
    }
  }
  
  return poem
}

/**
 * 创建新古诗
 */
export async function createPoem(data: CreatePoemData): Promise<number> {
  const {
    title,
    author,
    dynasty,
    genre = '其他',
    content,
    content_lines = [],
    is_active = true
  } = data
  
  const query = `
    INSERT INTO poems (title, author, dynasty, genre, content, content_lines, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `
  
  const contentLinesJson = content_lines.length > 0 ? JSON.stringify(content_lines) : null
  
  const result = await db.query(query, [
    title,
    author,
    dynasty,
    genre,
    content,
    contentLinesJson,
    is_active
  ])
  
  return (result as any).insertId
}

/**
 * 更新古诗
 */
export async function updatePoem(id: number, data: UpdatePoemData): Promise<void> {
  const fields: string[] = []
  const values: any[] = []
  
  if (data.title !== undefined) {
    fields.push('title = ?')
    values.push(data.title)
  }
  
  if (data.author !== undefined) {
    fields.push('author = ?')
    values.push(data.author)
  }
  
  if (data.dynasty !== undefined) {
    fields.push('dynasty = ?')
    values.push(data.dynasty)
  }
  
  if (data.genre !== undefined) {
    fields.push('genre = ?')
    values.push(data.genre)
  }
  
  if (data.content !== undefined) {
    fields.push('content = ?')
    values.push(data.content)
  }
  
  if (data.content_lines !== undefined) {
    fields.push('content_lines = ?')
    values.push(JSON.stringify(data.content_lines))
  }
  
  if (data.is_active !== undefined) {
    fields.push('is_active = ?')
    values.push(data.is_active)
  }
  
  if (fields.length === 0) {
    throw new Error('没有要更新的字段')
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP')
  values.push(id)
  
  const query = `
    UPDATE poems 
    SET ${fields.join(', ')}
    WHERE id = ?
  `
  
  const result = await db.query(query, values)
  
  if ((result as any).affectedRows === 0) {
    throw new Error('古诗不存在')
  }
}

/**
 * 删除古诗
 */
export async function deletePoem(id: number): Promise<void> {
  const query = 'DELETE FROM poems WHERE id = ?'
  const result = await db.query(query, [id])
  
  if ((result as any).affectedRows === 0) {
    throw new Error('古诗不存在')
  }
}

/**
 * 按句拆分诗文内容
 */
export function splitPoemContent(content: string, genre?: string): string[] {
  const lines = (content.match(/[^，。！？；]+[，。！？；]?/g) || [])
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  if (lines.length > 0) return lines

  const normalize = (s: string) => s.replace(/[\s\p{P}]/gu, "")
  const chars = normalize(content)
  if (!chars) return []

  let perLine = 0
  let lineCount = 0
  switch (genre) {
    case '五言绝句':
      perLine = 5; lineCount = 4; break
    case '七言绝句':
      perLine = 7; lineCount = 4; break
    case '五言律诗':
      perLine = 5; lineCount = 8; break
    case '七言律诗':
      perLine = 7; lineCount = 8; break
    default:
      perLine = Math.ceil(chars.length / 4); lineCount = 4; break
  }

  const result: string[] = []
  for (let i = 0; i < lineCount; i++) {
    const start = i * perLine
    const part = chars.slice(start, start + perLine)
    if (!part) break
    const punctuation = i % 2 === 0 ? '，' : '。'
    result.push(part + punctuation)
  }
  return result
}

/**
 * 获取所有体裁列表
 */
export function getGenres(): string[] {
  return ['五言绝句', '七言绝句', '五言律诗', '七言律诗', '其他']
}
