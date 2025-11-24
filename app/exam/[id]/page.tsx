"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChoiceQuestion } from "@/components/choice-question"

interface ChoiceOption {
  id: string
  content: string
  isCorrect: boolean
}

interface ExamChoiceQuestion {
  id: number
  title: string
  description?: string
  options: ChoiceOption[]
  points: number
}

export default function ExamPage() {
  const params = useParams()
  const id = params.id as string
  const [paper, setPaper] = useState<any | null>(null)
  const [examQuestions, setExamQuestions] = useState<ExamChoiceQuestion[]>([])
  const [answers, setAnswers] = useState<any[]>([])
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const isLast = currentIndex === Math.max(0, examQuestions.length - 1)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/papers/${id}`)
      const data = await res.json()
      setPaper(data.paper)

      // 题库完整数据（含选项/提示/图片等）
      const qres = await fetch('/api/questions')
      const qdata = await qres.json() as { questions: any[] }
      const dict: Record<number, any> = {}
      (qdata.questions || []).forEach((q: any) => { dict[q.id] = q })

      // 合并试卷项与题库选项，仅选择题
      const merged: ExamChoiceQuestion[] = (data.items || [])
        .filter((it: any) => it.question_type === 'choice')
        .map((it: any) => {
          const q = dict[it.question_id]
          return {
            id: it.question_id,
            title: it.title,
            description: it.description,
            options: q?.options || [],
            points: it.points || 0,
          }
        })

      setExamQuestions(merged)

      const startRes = await fetch('/api/exams/start', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: 'local-user', paper_id: Number(id) })
      })
      const startData = await startRes.json()
      setSessionId(startData.session_id)
    }
    load()
  }, [id])

  const setChoiceAnswer = (qid: number, selected: string[]) => {
    const next = answers.filter((a) => a.question_id !== qid)
    next.push({ question_id: qid, selected })
    setAnswers(next)
  }

  const handleSubmit = async () => {
    if (!sessionId) return
    setSubmitting(true)
    const res = await fetch('/api/exams/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: sessionId, answers }) })
    const data = await res.json()
    setSubmitting(false)
    alert(`得分：${data.score}`)
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">{paper?.title}</h1>
        {examQuestions.length > 0 && (
          <div className="mb-4 flex items-center justify-center gap-4">
            <div className="rounded-full bg-secondary px-6 py-2 font-semibold text-secondary-foreground">
              第 {currentIndex + 1} 题 / 共 {examQuestions.length} 题
            </div>
            <div className="rounded-full bg-accent px-6 py-2 font-semibold text-accent-foreground">
              分值：{examQuestions[currentIndex].points}
            </div>
          </div>
        )}
        {examQuestions.length > 0 && (
          <ChoiceQuestion
            question={examQuestions[currentIndex]}
            onComplete={() => {}}
            onSubmitAnswer={(selected) => setChoiceAnswer(examQuestions[currentIndex].id, selected)}
          />
        )}
        <div className="mt-8 flex justify-center gap-4">
          {!isLast ? (
            <Button onClick={() => setCurrentIndex((i) => Math.min(i + 1, examQuestions.length - 1))} disabled={examQuestions.length === 0}>下一题</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting || !sessionId}>提交</Button>
          )}
        </div>
      </div>
    </div>
  )
}
