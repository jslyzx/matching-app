"use client"

import { useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DraftPad } from "@/components/draft-pad"
import { renderMathContent } from "@/components/math-formula"

interface FillBlankQuestionProps {
  question: {
    id: number
    title?: string
    description?: string
    blanks: Array<{ idx: number }>
    hintEnabled?: boolean
    hintText?: string | null
    imageEnabled?: boolean
    imageUrl?: string | null
    draftEnabled?: boolean
  }
  onComplete: (correct: boolean) => void
}

export function FillBlankQuestion({ question, onComplete }: FillBlankQuestionProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [showHint, setShowHint] = useState(false)
  const [openDraft, setOpenDraft] = useState(false)
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const renderWithBlanks = (text: string) => {
    const nodes: React.ReactNode[] = []
    const re = /\{_([0-9]+)\}/g
    let last = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) != null) {
      const before = text.slice(last, m.index)
      if (before) {
        nodes.push(
          <span key={`t-${last}-${m.index}`}>
            {renderMathContent(before, `fill-text-${question.id}-${last}-${m.index}`, { as: "span", justify: "start" })}
          </span>
        )
      }
      const idx = parseInt(m[1], 10)
      nodes.push(
        <span key={`b-${idx}-${m.index}`} className="inline-flex items-center align-middle">
          <span>(</span>
          <input
            type="text"
            className="w-[100px] bg-transparent border-none outline-none focus:outline-none focus:ring-0 caret-blue-600"
            value={answers[idx] || ""}
            onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
            ref={(el) => { inputRefs.current[idx] = el }}
            aria-label={`blank-${idx}`}
          />
          <span>)</span>
        </span>
      )
      last = m.index + m[0].length
    }
    const tail = text.slice(last)
    if (tail) {
      nodes.push(
        <span key={`t-tail-${last}`}>
          {renderMathContent(tail, `fill-text-${question.id}-tail-${last}`, { as: "span", justify: "start" })}
        </span>
      )
    }
    return nodes
  }

  const handleSubmit = () => {
    const required = question.blanks.map((b) => b.idx)
    for (const idx of required) {
      if (!answers[idx] || answers[idx].trim() === "") {
        onComplete(false)
        return
      }
    }
    onComplete(true)
  }

  return (
    <div className="space-y-6">
      {question.imageEnabled && question.imageUrl ? (
        <div className="flex justify-center">
          <img src={question.imageUrl} alt="题图" className="max-h-64 object-contain rounded" />
        </div>
      ) : null}
      <div className="text-lg leading-8">
        {renderWithBlanks(question.description || question.title || "")}
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={handleSubmit} className="px-6">提交</Button>
        {question.hintEnabled && question.hintText ? (
          <Button variant="outline" onClick={() => setShowHint((v) => !v)}>提示</Button>
        ) : null}
        {question.draftEnabled ? (
          <Button variant="secondary" onClick={() => setOpenDraft(true)}>草稿</Button>
        ) : null}
      </div>
      {showHint && question.hintText ? (
        <div className="rounded-md border p-3 text-sm text-slate-600">{question.hintText}</div>
      ) : null}
      <DraftPad open={openDraft} onClose={() => setOpenDraft(false)} />
    </div>
  )
}