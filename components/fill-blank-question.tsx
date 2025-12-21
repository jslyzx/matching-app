"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { DraftPad } from "@/components/draft-pad"
import { renderMathContent } from "@/components/math-formula"
import { cn } from "@/lib/utils"
import { Lightbulb } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface FillBlankQuestionProps {
  question: {
    id: number
    title?: string
    description?: string
    blanks: Array<{ idx: number; answer_text?: string }>
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
  const [submitted, setSubmitted] = useState(false)
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null)
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
      const userAns = (answers[idx] || "").trim()
      const correctAns = question.blanks.find(b => b.idx === idx)?.answer_text || ""
      const isCorrect = submitted && userAns === correctAns.trim()
      const isIncorrect = submitted && userAns !== correctAns.trim()
      
      nodes.push(
        <span key={`b-${idx}-${m.index}`} className="inline-flex items-center align-middle mx-1">
          <input
            type="text"
            className={cn(
              "w-[120px] text-center px-3 py-2 border-2 rounded-lg transition-all duration-200",
              !submitted && "bg-white border-gray-300 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              isCorrect && "bg-green-100 border-green-500 text-green-800",
              isIncorrect && "bg-red-100 border-red-500 text-red-800",
              submitted && "cursor-not-allowed"
            )}
            value={answers[idx] || ""}
            onChange={(e) => !submitted && setAnswers({ ...answers, [idx]: e.target.value })}
            ref={(el) => { inputRefs.current[idx] = el }}
            aria-label={`blank-${idx}`}
            disabled={submitted}
          />
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
    let allFilled = true
    for (const idx of required) {
      if (!answers[idx] || answers[idx].trim() === "") {
        allFilled = false
        break
      }
    }

    if (!allFilled) {
      alert("请填写所有空位")
      return
    }

    let isCorrect = true
    for (const blank of question.blanks) {
      const userAns = (answers[blank.idx] || "").trim()
      const correctAns = (blank.answer_text || "").trim()
      if (userAns !== correctAns) {
        isCorrect = false
        break
      }
    }

    setFeedback(isCorrect ? "correct" : "incorrect")
    setSubmitted(true)
    onComplete(isCorrect)
  }

  const handleRetry = () => {
    setAnswers({})
    setSubmitted(false)
    setFeedback(null)
  }

  return (
    <div className="relative">
      <DraftPad open={openDraft} onClose={() => setOpenDraft(false)} />
      <div className="mb-8 text-center">
        <h2 className="mb-4 font-bold text-2xl text-foreground md:text-3xl">
          {renderMathContent(question.title || "", "fill-title")}
        </h2>
        
        <div className="mt-4 flex items-center justify-center gap-3">
          {question.imageEnabled && question.imageUrl && (
            <img src={question.imageUrl} alt="题目图片" className="max-h-40 object-contain rounded-lg" />
          )}
          {question.hintEnabled && question.hintText ? (
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2 text-sm text-yellow-800 transition-colors hover:bg-yellow-200">
                  <Lightbulb className="w-4 h-4" />
                  <span>提示</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 rounded-xl border bg-white p-4 shadow-xl">
                <div className="text-sm leading-relaxed text-gray-700">{question.hintText}</div>
              </PopoverContent>
            </Popover>
          ) : null}
          {question.draftEnabled ? (
            <button 
              onClick={() => setOpenDraft(true)} 
              className="px-4 py-2 rounded-lg bg-gray-200 text-sm text-gray-800 transition-colors hover:bg-gray-300"
            >
              草稿
            </button>
          ) : null}
        </div>
      </div>
      
      <div className="max-w-3xl mx-auto px-4 py-8 rounded-2xl bg-gray-50 shadow-sm">
        <div className="text-lg leading-relaxed text-center">
          {renderWithBlanks(question.description || question.title || "")}
        </div>
      </div>
      
      <div className="mt-8 flex justify-center gap-4">
        {!submitted ? (
          <Button
            onClick={handleSubmit}
            size="lg"
            className="bg-primary px-8 font-bold text-lg text-primary-foreground hover:bg-primary/90"
          >
            提交答案
          </Button>
        ) : (
          <Button
            onClick={handleRetry}
            size="lg"
            className="bg-accent px-8 font-bold text-lg text-accent-foreground hover:bg-accent/90"
          >
            再试一次
          </Button>
        )}
      </div>
      
      {/* 反馈信息 */}
      {feedback && (
        <div
          className={cn(
            "mt-8 mx-auto max-w-md rounded-2xl p-6 text-center font-bold text-2xl",
            feedback === "correct" && "bg-accent text-accent-foreground",
            feedback === "incorrect" && "bg-red-500 text-white"
          )}
        >
          <div className="mb-4">{feedback === "correct" ? "太棒了！答对了！" : "答案不对哦！"}</div>
        </div>
      )}
    </div>
  )
}