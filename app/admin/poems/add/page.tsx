'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { ArrowLeft, Save } from 'lucide-react'

const GENRES = [
  { value: '五言绝句', label: '五言绝句' },
  { value: '七言绝句', label: '七言绝句' },
  { value: '五言律诗', label: '五言律诗' },
  { value: '七言律诗', label: '七言律诗' },
  { value: '其他', label: '其他' }
]

export default function AddPoemPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    dynasty: '',
    genre: '其他',
    content: '',
    is_active: true
  })

  const splitContentIntoLines = (content: string): string[] => {
    return content
      .split(/[。！？；]/g)
      .map(line => line.trim())
      .filter(line => line.length > 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast({ title: '错误', description: '请输入诗题', variant: 'destructive' })
      return
    }
    
    if (!formData.author.trim()) {
      toast({ title: '错误', description: '请输入作者', variant: 'destructive' })
      return
    }
    
    if (!formData.dynasty.trim()) {
      toast({ title: '错误', description: '请输入朝代', variant: 'destructive' })
      return
    }
    
    if (!formData.content.trim()) {
      toast({ title: '错误', description: '请输入诗文内容', variant: 'destructive' })
      return
    }

    try {
      setLoading(true)
      
      const contentLines = splitContentIntoLines(formData.content)
      
      const response = await fetch('/api/admin/poems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          content_lines: contentLines
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '添加失败')
      }

      toast({
        title: '成功',
        description: '古诗添加成功'
      })
      
      router.push('/admin/poems')
    } catch (error) {
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '添加失败，请稍后重试',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-bold">新增古诗</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">诗题 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="请输入诗题"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="author">作者 *</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="请输入作者"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dynasty">朝代 *</Label>
                <Input
                  id="dynasty"
                  value={formData.dynasty}
                  onChange={(e) => setFormData(prev => ({ ...prev, dynasty: e.target.value }))}
                  placeholder="请输入朝代，如：唐、宋、明等"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="genre">体裁 *</Label>
                <Select value={formData.genre} onValueChange={(value) => setFormData(prev => ({ ...prev, genre: value }))}>
                  <SelectTrigger id="genre">
                    <SelectValue placeholder="请选择体裁" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRES.map((genre) => (
                      <SelectItem key={genre.value} value={genre.value}>
                        {genre.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">诗文内容 *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="请输入完整的诗文内容，系统将自动按句拆分"
                rows={8}
                required
              />
              <p className="text-sm text-gray-500">
                提示：系统会根据句号、感叹号、问号、分号等标点符号自动拆分诗句
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_active" className="text-sm font-medium">
                立即启用
              </Label>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? '保存中...' : '保存'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}