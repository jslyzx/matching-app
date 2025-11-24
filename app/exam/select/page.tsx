"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export default function ExamSelectPage() {
  const [papers, setPapers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await fetch('/api/papers')
      const data = await res.json()
      setPapers(data.papers || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">选择试卷</h1>
        {loading ? (<div>加载中...</div>) : (
          <div className="space-y-3">
            {papers.map((p) => (
              <div key={p.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="font-semibold">{p.title}</div>
                  <div className="text-sm text-gray-500">题量：{p.question_count} 总分：{p.total_points}</div>
                </div>
                <Button onClick={() => (window.location.href = `/exam/${p.id}`)}>开始考试</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
