"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Plus, Download } from "lucide-react"
import { renderMathContent } from "@/components/math-formula"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Question {
  id: number
  title: string
  description: string
  difficulty_level: string
  grade: string
  subject: string
  is_active: number
  created_at: string
}

export default function AdminPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [keyword, setKeyword] = useState("")
  const [type, setType] = useState<string | undefined>(undefined)
  const [difficulty, setDifficulty] = useState<string | undefined>(undefined)
  const [grade, setGrade] = useState<string | undefined>(undefined)
  const [subject, setSubject] = useState<string | undefined>(undefined)
  const [isActive, setIsActive] = useState<string | undefined>(undefined)

  useEffect(() => {
    fetchQuestions()
  }, [page, pageSize])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("pageSize", String(pageSize))
      if (keyword) params.set("keyword", keyword)
      if (type) params.set("type", type)
      if (difficulty) params.set("difficulty", difficulty)
      if (grade) params.set("grade", grade)
      if (subject) params.set("subject", subject)
      if (isActive) params.set("is_active", isActive)
      const response = await fetch(`/api/admin/questions?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch questions")
      const data = await response.json()
      setQuestions(data.questions || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError("加载题目失败")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个题目吗？")) return

    try {
      const response = await fetch(`/api/admin/questions/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete")
      fetchQuestions()
    } catch (err) {
      alert("删除失败")
      console.error(err)
    }
  }

  const handleToggleStatus = async (id: number, currentStatus: number) => {
    const newStatus = !currentStatus
    try {
      const response = await fetch(`/api/admin/questions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newStatus }),
      })
      if (!response.ok) throw new Error("Failed to update status")
      fetchQuestions()
    } catch (err) {
      alert("更新状态失败")
      console.error(err)
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch("/api/admin/export")
      if (!response.ok) throw new Error("Export failed")
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `questions_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      alert("导出失败")
      console.error(err)
    }
  }

  const handleBulkStatus = async (active: boolean) => {
    if (!confirm(active ? "确定要启用全部题目吗？" : "确定要停用全部题目吗？")) return
    try {
      const res = await fetch("/api/admin/questions/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: active })
      })
      if (!res.ok) throw new Error("Failed to bulk update")
      await fetchQuestions()
    } catch (err) {
      alert("批量更新失败")
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">题目管理</h1>
            <div className="flex gap-3">
              <Button onClick={handleExport} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                导出Excel
              </Button>
              <Button onClick={() => (window.location.href = "/admin/add")}>
                <Plus className="w-4 h-4 mr-2" />
                新增题目
              </Button>
              <Button onClick={() => handleBulkStatus(true)} variant="secondary">全部启用</Button>
              <Button onClick={() => handleBulkStatus(false)} variant="outline">全部停用</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-6">
            <div className="md:col-span-2">
              <Input placeholder="关键字（标题/描述）" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
            <div>
              <Select value={type} onValueChange={(v) => setType(v || undefined)}>
                <SelectTrigger><SelectValue placeholder="题型" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="matching">连线题</SelectItem>
                  <SelectItem value="choice">选择题</SelectItem>
                  <SelectItem value="poem_fill">古诗填空</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v || undefined)}>
                <SelectTrigger><SelectValue placeholder="难度" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">简单</SelectItem>
                  <SelectItem value="medium">中等</SelectItem>
                  <SelectItem value="hard">困难</SelectItem>
                  <SelectItem value="error_prone">易错题</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={grade} onValueChange={(v) => setGrade(v || undefined)}>
                <SelectTrigger><SelectValue placeholder="年级" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grade1">一年级</SelectItem>
                  <SelectItem value="grade2">二年级</SelectItem>
                  <SelectItem value="grade3">三年级</SelectItem>
                  <SelectItem value="grade4">四年级</SelectItem>
                  <SelectItem value="grade5">五年级</SelectItem>
                  <SelectItem value="grade6">六年级</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={subject} onValueChange={(v) => setSubject(v || undefined)}>
                <SelectTrigger><SelectValue placeholder="科目" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="math">数学</SelectItem>
                  <SelectItem value="chinese">语文</SelectItem>
                  <SelectItem value="english">英语</SelectItem>
                  <SelectItem value="science">科学</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={isActive} onValueChange={(v) => setIsActive(v || undefined)}>
                <SelectTrigger><SelectValue placeholder="状态" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">启用</SelectItem>
                  <SelectItem value="0">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-6 flex gap-2">
              <Button onClick={() => { setPage(1); fetchQuestions() }} variant="default">查询</Button>
              <Button onClick={() => {
                setKeyword(""); setType(undefined); setDifficulty(undefined); setGrade(undefined); setSubject(undefined); setIsActive(undefined); setPage(1); setPageSize(10); fetchQuestions()
              }} variant="outline">重置</Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>标题</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>难度</TableHead>
              <TableHead>年级</TableHead>
              <TableHead>科目</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell className="font-medium">{question.id}</TableCell>
                  <TableCell>{question.title}</TableCell>
                  <TableCell className="max-w-xs truncate text-left">
                    {renderMathContent((question.description || "").replace(/\{_([0-9]+)\}/g, "()"), `admin-list-desc-${question.id}`, { as: "span", justify: "start" })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        question.difficulty_level === "easy"
                          ? "default"
                          : question.difficulty_level === "medium"
                            ? "secondary"
                            : question.difficulty_level === "error_prone"
                              ? "outline"
                              : "destructive"
                      }
                    >
                      {question.difficulty_level === "easy"
                        ? "简单"
                        : question.difficulty_level === "medium"
                          ? "中等"
                          : question.difficulty_level === "error_prone"
                            ? "易错题"
                            : "困难"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {question.grade === "grade1" ? "一年级" :
                       question.grade === "grade2" ? "二年级" :
                       question.grade === "grade3" ? "三年级" :
                       question.grade === "grade4" ? "四年级" :
                       question.grade === "grade5" ? "五年级" :
                       question.grade === "grade6" ? "六年级" : "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {question.subject === "math" ? "数学" :
                       question.subject === "chinese" ? "语文" :
                       question.subject === "english" ? "英语" :
                       question.subject === "science" ? "科学" : "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={question.is_active ? "default" : "outline"}>
                      {question.is_active ? "启用" : "禁用"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(question.created_at).toLocaleDateString("zh-CN")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => (window.location.href = `/admin/edit/${question.id}`)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant={question.is_active ? "ghost" : "default"}
                        size="sm" 
                        onClick={() => handleToggleStatus(question.id, question.is_active)}
                        className={question.is_active ? "text-amber-600" : "text-green-600"}
                      >
                        {question.is_active ? "停用" : "启用"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(question.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {questions.length === 0 && (
            <div className="text-center py-12 text-gray-500">暂无题目，点击"新增题目"开始添加</div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">共 {total} 条，当前第 {page} / {Math.max(1, Math.ceil(total / pageSize))} 页</div>
            <div className="flex items-center gap-2">
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(parseInt(v, 10)); setPage(1) }}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">每页 10</SelectItem>
                  <SelectItem value="20">每页 20</SelectItem>
                  <SelectItem value="50">每页 50</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>上一页</Button>
              <Button variant="outline" disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage((p) => p + 1)}>下一页</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
