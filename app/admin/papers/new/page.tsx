"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { renderMathContent } from "@/components/math-formula"
import { gradeLabel, subjectLabel } from "@/lib/labels"

export default function NewPaperPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [grade, setGrade] = useState<string | undefined>(undefined)
  const [subject, setSubject] = useState<string | undefined>(undefined)
  const [keyword, setKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [questions, setQuestions] = useState<any[]>([])
  const [details, setDetails] = useState<Record<number, any>>({})
  const [selected, setSelected] = useState<{ question_id: number; display_order: number; points: number }[]>([])
  const [saving, setSaving] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [batchType, setBatchType] = useState<"all" | "choice" | "matching" | "poem_fill">("all")
  const [batchPoints, setBatchPoints] = useState<number>(5)
  const [paperId, setPaperId] = useState<number | null>(null)

  const totalPoints = useMemo(() => selected.reduce((sum, s) => sum + (Number.isFinite(s.points) ? s.points : 0), 0), [selected])

  useEffect(() => {
    async function load() {
      const qp = new URLSearchParams()
      qp.set('page', String(page))
      qp.set('pageSize', String(pageSize))
      if (keyword) qp.set('keyword', keyword)
      if (grade) qp.set('grade', grade)
      if (subject) qp.set('subject', subject)
      const res = await fetch(`/api/admin/questions?${qp.toString()}`)
      const data = await res.json()
      const list = data.questions || []
      setQuestions(list)
      setTotal(data.total || 0)
      // 预览直接展示：为当前页的题目加载详情
      const detailEntries = await Promise.all(
        (list as any[]).map(async (q: any) => {
          const r = await fetch(`/api/admin/questions/${q.id}`)
          const d = await r.json()
          return [q.id, d] as const
        })
      )
      const dmap: Record<number, any> = {}
      for (const [qid, d] of detailEntries) dmap[qid] = d
      setDetails(dmap)
    }
    load()
  }, [page, pageSize, keyword, grade, subject])

  const addQuestion = (q: any) => {
    if (selected.some(s => s.question_id === q.id)) return
    setSelected([...selected, { question_id: q.id, display_order: selected.length + 1, points: 5 }])
  }

  const removeQuestion = (qid: number) => {
    const next = selected.filter(s => s.question_id !== qid).map((s, i) => ({ ...s, display_order: i + 1 }))
    setSelected(next)
  }

  const moveUp = (index: number) => {
    if (index <= 0) return
    const next = [...selected]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    setSelected(next.map((s, i) => ({ ...s, display_order: i + 1 })))
  }

  const moveDown = (index: number) => {
    if (index >= selected.length - 1) return
    const next = [...selected]
    ;[next[index + 1], next[index]] = [next[index], next[index + 1]]
    setSelected(next.map((s, i) => ({ ...s, display_order: i + 1 })))
  }

  const clampPoints = (n: number) => (Number.isFinite(n) ? Math.min(100, Math.max(1, n)) : 5)

  const updatePoints = (index: number, pts: number) => {
    const next = [...selected]
    next[index].points = clampPoints(pts)
    setSelected(next)
  }

  const isSelected = (qid: number) => selected.some(s => s.question_id === qid)

  // 确保右侧清单的题目都有详情数据用于预览
  useEffect(() => {
    async function ensureDetails() {
      const missing = selected.filter(s => !details[s.question_id])
      if (missing.length === 0) return
      const entries = await Promise.all(
        missing.map(async (s) => {
          const r = await fetch(`/api/admin/questions/${s.question_id}`)
          const d = await r.json()
          return [s.question_id, d] as const
        })
      )
      const dmap = { ...details }
      for (const [qid, d] of entries) dmap[qid] = d
      setDetails(dmap)
    }
    ensureDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  // 拖拽排序
  const onDragStart = (index: number) => setDragIndex(index)
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault() }
  const onDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) { setDragIndex(null); return }
    const next = [...selected]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(index, 0, moved)
    setSelected(next.map((s, i) => ({ ...s, display_order: i + 1 })))
    setDragIndex(null)
  }

  const getTypeFor = (qid: number) => {
    const d = details[qid]
    if (d?.question?.question_type) return d.question.question_type as "choice" | "matching" | "poem_fill"
    const q = questions.find((x) => x.id === qid)
    return (q?.question_type || "choice") as "choice" | "matching" | "poem_fill"
  }

  const applyBatchPoints = () => {
    const pts = clampPoints(batchPoints)
    const next = selected.map((s) => {
      const t = getTypeFor(s.question_id)
      if (batchType === "all" || batchType === t) return { ...s, points: pts }
      return s
    })
    setSelected(next)
  }

  const handleSave = async () => {
    if (!title) return alert('请填写试卷标题')
    if (selected.length === 0) return alert('请至少加入一道题目')
    if (selected.some((s) => !Number.isFinite(s.points) || s.points < 1 || s.points > 100)) return alert('题目分值需为 1-100 的整数')
    setSaving(true)
    let pid = paperId
    if (!pid) {
      const res = await fetch('/api/admin/papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, grade, subject })
      })
      if (!res.ok) { setSaving(false); return alert('保存失败') }
      const data = await res.json()
      pid = data.id
      setPaperId(pid)
    } else {
      const res = await fetch(`/api/admin/papers/${pid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, grade, subject, total_points: totalPoints })
      })
      if (!res.ok) { setSaving(false); return alert('保存失败') }
    }
    const resItems = await fetch(`/api/admin/papers/${pid}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: selected })
    })
    setSaving(false)
    if (!resItems.ok) return alert('保存失败')
    alert('已保存试卷')
  }

  const handlePreview = async () => {
    if (!paperId) {
      await handleSave()
    }
    const pid = paperId
    if (!pid) return
    window.location.href = `/admin/papers/preview/${pid}`
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">试卷信息</h2>
          <div className="space-y-3">
            <Label>标题</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            <Label>描述</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>年级</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger><SelectValue placeholder="选择年级" /></SelectTrigger>
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
                <Label>科目</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger><SelectValue placeholder="选择科目" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="math">数学</SelectItem>
                    <SelectItem value="chinese">语文</SelectItem>
                    <SelectItem value="english">英语</SelectItem>
                    <SelectItem value="science">科学</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2">
            <Button variant="outline" onClick={handleSave} disabled={saving}>保存</Button>
            <Button onClick={handlePreview} disabled={saving}>预览</Button>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">题库</h2>
          <div className="flex items-center gap-2 mb-3">
            <Input placeholder="搜索标题或描述" value={keyword} onChange={(e) => setKeyword(e.target.value)} className="flex-1" />
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(parseInt(v))}>
              <SelectTrigger className="w-28"><SelectValue placeholder="每页" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setPage(1)}>搜索</Button>
          </div>
          <div className="space-y-2">
            {questions.map((q) => {
              const d = details[q.id]
              return (
                <div key={q.id} className="border rounded p-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{renderMathContent(q.title, `paper-qtitle-${q.id}`, { as: 'div', justify: 'start', wrapperClassName: 'text-sm leading-snug' })}</div>
                      {q.description && q.description.trim() !== (q.title || '').trim() && (
                        <div className="mt-0.5 text-xs text-gray-600">
                          {renderMathContent(q.description, `paper-qdesc-${q.id}`, { as: 'div', justify: 'start', wrapperClassName: 'text-xs leading-snug text-gray-600' })}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">{q.question_type} · {gradeLabel(q.grade)} · {subjectLabel(q.subject)}</div>
                    </div>
                    <Button size="sm" variant={isSelected(q.id) ? "destructive" : undefined} onClick={() => (isSelected(q.id) ? removeQuestion(q.id) : addQuestion(q))}>
                      {isSelected(q.id) ? "移除" : "加入"}
                    </Button>
                  </div>
                  {d && (
                    <div className="mt-2 text-xs leading-snug">
                      {d.question?.question_type === 'choice' ? (
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                          {(d.options || []).slice(0, 4).map((op: any, i: number) => (
                            <div key={i} className="flex">
                              <span className="font-semibold mr-1">{String.fromCharCode(65 + i)}.</span>
                              <span className="min-w-0">
                                {renderMathContent(op.content, `paper-q${q.id}-opt-${i}`, { as: 'span', justify: 'start', wrapperClassName: 'text-xs leading-snug' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : d.question?.question_type === 'matching' ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            {(d.items || []).filter((it: any) => it.side === 'left').map((it: any, li: number) => (
                              <div key={it.id}>
                                {renderMathContent(it.content, `paper-q${q.id}-left-${li}`, { as: 'div', justify: 'start', wrapperClassName: 'text-xs leading-snug' })}
                              </div>
                            ))}
                          </div>
                          <div className="space-y-1">
                            {(d.items || []).filter((it: any) => it.side === 'right').map((it: any, idx: number) => (
                              <div key={it.id} className="flex">
                                <span className="font-semibold mr-1">{String.fromCharCode(65 + idx)}.</span>
                                <span className="min-w-0">
                                  {renderMathContent(it.content, `paper-q${q.id}-right-${idx}`, { as: 'span', justify: 'start', wrapperClassName: 'text-xs leading-snug' })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-gray-600">古诗填空（缩略预览）</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              共 {total} 条｜每页 {pageSize} 条｜当前页 {page}/{Math.max(1, Math.ceil(total / pageSize))}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>回到开头</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>上一页</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page * pageSize >= total}>下一页</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, Math.ceil(total / pageSize)))} disabled={page * pageSize >= total}>结尾</Button>
            </div>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mt-6 mb-2">
            <h2 className="text-xl font-semibold">试卷清单</h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">总分：<span className="font-semibold">{totalPoints}</span></span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-600">批量设置：</span>
              <Select value={batchType} onValueChange={(v) => setBatchType(v as any)}>
                <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="choice">选择题</SelectItem>
                  <SelectItem value="matching">连线题</SelectItem>
                  <SelectItem value="poem_fill">古诗填空</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" value={batchPoints} onChange={(e) => setBatchPoints(parseInt(e.target.value || '0'))} className="w-20 h-8 text-xs" title="设置该类型题目的分值" />
              <span className="text-gray-600">分</span>
              <Button size="sm" variant="outline" onClick={applyBatchPoints}>应用</Button>
            </div>
          </div>
          <div className="space-y-2">
            {selected.map((s, idx) => {
              const d = details[s.question_id]
              const qtype = d?.question?.question_type || questions.find(q => q.id === s.question_id)?.question_type
              const title = d?.question?.title || questions.find(q => q.id === s.question_id)?.title
              const desc = d?.question?.description || questions.find(q => q.id === s.question_id)?.description
              const q = questions.find(q => q.id === s.question_id)
              return (
                <div
                  key={s.question_id}
                  className="border rounded p-3"
                  draggable
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={onDragOver}
                  onDrop={() => onDrop(idx)}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="text-xs text-gray-500">{idx + 1}. {qtype} · {gradeLabel(q?.grade)} · {subjectLabel(q?.subject)}</div>
                      <div className="font-medium text-sm">
                        {renderMathContent(title || '', `sel-qtitle-${s.question_id}`, { as: 'div', justify: 'start', wrapperClassName: 'text-sm leading-snug' })}
                      </div>
                      {desc && desc.trim() !== (title || '').trim() && (
                        <div className="mt-0.5 text-xs text-gray-600">
                          {renderMathContent(desc, `sel-qdesc-${s.question_id}`, { as: 'div', justify: 'start', wrapperClassName: 'text-xs leading-snug text-gray-600' })}
                        </div>
                      )}
                      {qtype === 'choice' && d && (
                        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                          {(d.options || []).slice(0,4).map((op: any, i: number) => (
                            <div key={i} className="flex">
                              <span className="font-semibold mr-1">{String.fromCharCode(65 + i)}.</span>
                              <span className="min-w-0">{renderMathContent(op.content, `sel-q${s.question_id}-opt-${i}`, { as: 'span', justify: 'start', wrapperClassName: 'text-xs leading-snug' })}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {qtype === 'matching' && d && (
                        <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1">
                            {(d.items || []).filter((it: any) => it.side === 'left').map((it: any, li: number) => (
                              <div key={it.id}>{renderMathContent(it.content, `sel-q${s.question_id}-left-${li}`, { as: 'div', justify: 'start', wrapperClassName: 'text-xs leading-snug' })}</div>
                            ))}
                          </div>
                          <div className="space-y-1">
                            {(d.items || []).filter((it: any) => it.side === 'right').map((it: any, ri: number) => (
                              <div key={it.id} className="flex"><span className="font-semibold mr-1">{String.fromCharCode(65 + ri)}.</span>{renderMathContent(it.content, `sel-q${s.question_id}-right-${ri}`, { as: 'span', justify: 'start', wrapperClassName: 'text-xs leading-snug' })}</div>
                            ))}
                          </div>
                        </div>
                      )}
                      {qtype === 'poem_fill' && (
                        <div className="mt-2 text-xs text-gray-600">古诗填空（缩略预览）</div>
                      )}
                    </div>
                    <div className="ml-3 flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={s.points}
                          onChange={(e) => updatePoints(idx, parseInt(e.target.value || '0'))}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowUp') { e.preventDefault(); updatePoints(idx, (selected[idx].points || 0) + 1) }
                            if (e.key === 'ArrowDown') { e.preventDefault(); updatePoints(idx, (selected[idx].points || 0) - 1) }
                          }}
                          className="w-20 h-8 text-xs"
                          title="该题分值（1-100）"
                        />
                        <span className="text-xs text-gray-600">分</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="destructive" onClick={() => removeQuestion(s.question_id)}>移除</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
