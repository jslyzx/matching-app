"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { renderMathContent } from "@/components/math-formula"
import { gradeLabel, subjectLabel } from "@/lib/labels"

export default function PaperPreviewPage() {
  const params = useParams()
  const id = params.id as string
  const [paper, setPaper] = useState<any | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [details, setDetails] = useState<Record<number, any>>({})

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/papers/${id}`)
      const data = await res.json()
      setPaper(data.paper)
      setItems(data.items || [])
    }
    load()
  }, [id])

  useEffect(() => {
    async function loadDetails() {
      const missing = items.filter((it) => !details[it.question_id])
      if (missing.length === 0) return
      const entries = await Promise.all(
        missing.map(async (it) => {
          const r = await fetch(`/api/admin/questions/${it.question_id}`)
          const d = await r.json()
          return [it.question_id, d] as const
        })
      )
      const dmap = { ...details }
      for (const [qid, d] of entries) dmap[qid] = d
      setDetails(dmap)
    }
    if (items.length) loadDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-[800px] mx-auto">
        <div className="mb-4 flex justify-end gap-2 no-print">
          <Button onClick={handlePrint}>打印</Button>
        </div>
        <div className="paper-container">
          <h1 className="text-3xl font-bold text-center mb-2">{paper?.title}</h1>
          <div className="text-center mb-2 text-sm no-print">{gradeLabel(paper?.grade) || ''} {subjectLabel(paper?.subject) || ''} 总分：{paper?.total_points}</div>
          <div className="text-center mb-6 text-sm print-only">总分：{paper?.total_points}</div>
          <div className="space-y-6">
            {items.map((it, idx) => (
              <div key={it.id} className="break-inside-avoid">
                {(() => {
                  const d = details[it.question_id]
                  const title = d?.question?.title || it.question_title
                  const desc = d?.question?.description || ''
                  return (
                    <>
                      <div className="font-semibold mb-1">{idx + 1}. {renderMathContent(title, `pv-qtitle-${it.question_id}`, { as: 'span', justify: 'start' })} （{it.points}分）</div>
                      {desc && desc.trim() !== (title || '').trim() && (
                        <div className="mb-2 text-sm text-gray-600">{renderMathContent(desc, `pv-qdesc-${it.question_id}`, { as: 'div', justify: 'start' })}</div>
                      )}
                    </>
                  )
                })()}
                {it.question_type === 'choice' && (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 print:grid-cols-2">
                    {(details[it.question_id]?.options || []).slice(0,4).map((op: any, i: number) => (
                      <div key={i}>
                        <span className="font-semibold mr-1">{String.fromCharCode(65 + i)}.</span>
                        <span>{renderMathContent(op.content, `pv-q${it.question_id}-opt-${i}`, { as: 'span', justify: 'start' })}</span>
                      </div>
                    ))}
                  </div>
                )}
                {it.question_type === 'matching' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      {(details[it.question_id]?.items || []).filter((x: any) => x.side === 'left').map((x: any, li: number) => (
                        <div key={x.id}>{renderMathContent(x.content, `pv-q${it.question_id}-left-${li}`, { as: 'div', justify: 'start' })}</div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {(details[it.question_id]?.items || []).filter((x: any) => x.side === 'right').map((x: any, ri: number) => (
                        <div key={x.id}><span className="font-semibold mr-1">{String.fromCharCode(65 + ri)}.</span>{renderMathContent(x.content, `pv-q${it.question_id}-right-${ri}`, { as: 'span', justify: 'start' })}</div>
                      ))}
                    </div>
                  </div>
                )}
                {it.question_type === 'poem_fill' && (
                  <div className="space-y-2">
                    <div className="h-6 border-b" />
                    <div className="h-6 border-b" />
                    <div className="h-6 border-b" />
                    <div className="h-6 border-b" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
