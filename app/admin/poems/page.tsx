'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Pagination } from '@/components/ui/pagination'
import { toast } from '@/components/ui/use-toast'
import { Search, Plus, Edit, Trash2, Eye } from 'lucide-react'

interface Poem {
  id: number
  title: string
  author: string
  dynasty: string
  genre: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface PoemsResponse {
  poems: Poem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const GENRES = [
  { value: 'all', label: '全部体裁' },
  { value: '五言绝句', label: '五言绝句' },
  { value: '七言绝句', label: '七言绝句' },
  { value: '五言律诗', label: '五言律诗' },
  { value: '七言律诗', label: '七言律诗' },
  { value: '其他', label: '其他' }
]

export default function PoemsAdminPage() {
  const router = useRouter()
  const [poems, setPoems] = useState<Poem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const limit = 10

  const fetchPoems = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(selectedGenre && selectedGenre !== 'all' ? { genre: selectedGenre } : {})
      })

      const response = await fetch(`/api/admin/poems?${params}`)
      if (!response.ok) throw new Error('获取古诗列表失败')
      
      const data: PoemsResponse = await response.json()
      setPoems(data.poems)
      setTotalPages(data.totalPages)
      setTotalItems(data.total)
    } catch (error) {
      toast({
        title: '错误',
        description: '获取古诗列表失败，请稍后重试',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPoems()
  }, [currentPage, searchTerm, selectedGenre])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchPoems()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这首古诗吗？')) return

    try {
      const response = await fetch(`/api/admin/poems/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('删除失败')
      
      toast({
        title: '成功',
        description: '古诗删除成功'
      })
      
      fetchPoems()
    } catch (error) {
      toast({
        title: '错误',
        description: '删除失败，请稍后重试',
        variant: 'destructive'
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">古诗管理</CardTitle>
          <Button onClick={() => router.push('/admin/poems/add')}>
            <Plus className="mr-2 h-4 w-4" />
            新增古诗
          </Button>
        </CardHeader>
        <CardContent>
          {/* 搜索和筛选 */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜索标题或作者..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择体裁" />
              </SelectTrigger>
              <SelectContent>
                {GENRES.map((genre) => (
                  <SelectItem key={genre.value} value={genre.value}>
                    {genre.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              搜索
            </Button>
          </div>

          {/* 数据表格 */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>作者</TableHead>
                  <TableHead>朝代</TableHead>
                  <TableHead>体裁</TableHead>
                  <TableHead className="w-[100px]">状态</TableHead>
                  <TableHead className="w-[160px]">创建时间</TableHead>
                  <TableHead className="w-[120px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : poems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  poems.map((poem) => (
                    <TableRow key={poem.id}>
                      <TableCell className="font-medium">{poem.id}</TableCell>
                      <TableCell className="font-medium">{poem.title}</TableCell>
                      <TableCell>{poem.author}</TableCell>
                      <TableCell>{poem.dynasty}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{poem.genre}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={poem.is_active ? 'default' : 'secondary'}>
                          {poem.is_active ? '启用' : '禁用'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(poem.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/poems/edit/${poem.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(poem.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                共 {totalItems} 条记录，第 {currentPage} / {totalPages} 页
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
