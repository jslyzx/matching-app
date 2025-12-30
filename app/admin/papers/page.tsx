"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { gradeLabel, subjectLabel } from "@/lib/labels"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AdminPapersPage() {
  const [papers, setPapers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await fetch('/api/admin/papers')
      const data = await res.json()
      setPapers(data.papers || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">试卷管理</h1>
          <Button onClick={() => (window.location.href = '/admin/papers/new')}>新建试卷</Button>
        </div>
        {loading ? (
          <div>加载中...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>标题</TableHead>
                <TableHead>年级</TableHead>
                <TableHead>科目</TableHead>
                <TableHead>总分</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {papers.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>{p.title}</TableCell>
                  <TableCell>{gradeLabel(p.grade) || '-'}</TableCell>
                  <TableCell>{subjectLabel(p.subject) || '-'}</TableCell>
                  <TableCell>{p.total_points}</TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => (window.location.href = `/admin/papers/edit/${p.id}`)}>编辑</Button>
                    <Button variant="outline" size="sm" onClick={() => (window.location.href = `/admin/papers/preview/${p.id}`)}>预览</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
