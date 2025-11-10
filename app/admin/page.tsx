"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Plus, Download } from "lucide-react"

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

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/questions")
      if (!response.ok) throw new Error("Failed to fetch questions")
      const data = await response.json()
      setQuestions(data.questions || [])
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
                  <TableCell className="max-w-xs truncate">{question.description}</TableCell>
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
        </div>
      </div>
    </div>
  )
}
