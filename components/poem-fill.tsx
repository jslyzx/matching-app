"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Lightbulb } from "lucide-react"
import { DraftPad } from "@/components/draft-pad"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface PoemFillQuestion {
  id: number
  title: string
  author: string
  dynasty: string
  genre: string
  lines: string[]
  hintEnabled?: boolean
  hintText?: string | null
  imageEnabled?: boolean
  imageUrl?: string | null
  draftEnabled?: boolean
}

interface PoemFillProps {
  question: PoemFillQuestion
  onComplete: (isCorrect: boolean) => void
}

function normalizeLine(line: string): string {
  return line.replace(/[\s\p{P}]/gu, "")
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function PoemFill({ question, onComplete }: PoemFillProps) {
  const lineModels = useMemo(() => {
    return question.lines.map((line) => {
      const m = line.match(/^(.*?)([，。！？；])?$/)
      const text = (m?.[1] || '').trim()
      const punct = m?.[2] || ''
      const chars = text.replace(/[\s\p{P}]/gu, '')
      return { chars, punct }
    })
  }, [question.lines])
  const targetChars = useMemo(() => lineModels.map(l => l.chars).join(""), [lineModels])
  const pool = useMemo(() => shuffle([...targetChars]), [targetChars])
  const totalSlots = targetChars.length
  const [fills, setFills] = useState<string[]>(Array(totalSlots).fill(""))
  const [poolUsed, setPoolUsed] = useState<boolean[]>(Array(pool.length).fill(false))
  const [draftOpen, setDraftOpen] = useState(false)

  const nextEmptyIndex = fills.findIndex((c) => c === "")

  const handlePick = (index: number) => {
    if (poolUsed[index]) return
    if (nextEmptyIndex === -1) return
    const ch = pool[index]
    const nf = [...fills]
    nf[nextEmptyIndex] = ch
    const nu = [...poolUsed]
    nu[index] = true
    setFills(nf)
    setPoolUsed(nu)
    if (nextEmptyIndex === totalSlots - 1) {
      const isCorrect = nf.join("") === targetChars
      onComplete(isCorrect)
    }
  }

  const handleDelete = () => {
    let idx = fills.length - 1
    while (idx >= 0 && fills[idx] === "") idx--
    if (idx < 0) return
    const ch = fills[idx]
    const nf = [...fills]
    nf[idx] = ""
    const nu = [...poolUsed]
    const poolIndex = pool.findIndex((c, i) => c === ch && nu[i])
    if (poolIndex !== -1) {
      nu[poolIndex] = false
    }
    setFills(nf)
    setPoolUsed(nu)
  }

  const handleReset = () => {
    setFills(Array(totalSlots).fill(""))
    setPoolUsed(Array(pool.length).fill(false))
    
  }

  let cursor = 0
  const lineSlots = lineModels.map((model) => {
    const start = cursor
    cursor += model.chars.length
    const end = cursor
    return { slots: fills.slice(start, end), punct: model.punct, start }
  })

  return (
    <div className="space-y-6">
      <DraftPad open={draftOpen} onClose={() => setDraftOpen(false)} />
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold mb-2">{question.title}</div>
        <div className="text-muted-foreground text-lg">{question.dynasty} · {question.author}</div>
        <div className="mt-2 flex items-center justify-center gap-3">
          {question.imageEnabled && question.imageUrl && (
            <img src={question.imageUrl} alt="题目图片" className="max-h-40 object-contain" />
          )}
          {question.hintEnabled && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1">
                  <Lightbulb className="w-4 h-4 text-yellow-700" />
                  <span className="text-sm text-yellow-800">提示</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 rounded-xl border bg-white p-4 shadow-xl">
                <div className="text-sm leading-relaxed text-gray-700">{question.hintText}</div>
              </PopoverContent>
            </Popover>
          )}
          {question.draftEnabled && (
            <button onClick={() => setDraftOpen(true)} className="px-3 py-1 rounded bg-gray-200">草稿</button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {lineSlots.map((row, i) => (
          <div key={`line-${i}`} className="flex flex-wrap gap-2 justify-center">
            {row.slots.map((ch, j) => {
              const gi = row.start + j
              const wrong = ch && ch !== targetChars[gi]
              return (
              <div
                key={`slot-${i}-${j}`}
                className={cn(
                  "h-12 w-12 flex items-center justify-center border-b-2 text-xl",
                  !ch ? "border-muted-foreground/40 text-transparent" : wrong ? "border-red-500 text-red-600" : "border-primary text-foreground"
                )}
              >
                {ch || "·"}
              </div>
              )})}
            {row.punct && (
              <div className="h-12 w-12 flex items-center justify-center text-xl">
                {row.punct}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={handleDelete}>删除</Button>
        <Button variant="secondary" onClick={handleReset}>重置</Button>
      </div>

      <div className="mt-6 grid grid-cols-6 md:grid-cols-10 gap-2 justify-items-center">
        {pool.map((c, i) => (
          <Card
            key={`pool-${i}`}
            onClick={() => handlePick(i)}
            className={cn(
              "cursor-pointer w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-lg font-semibold",
              poolUsed[i] ? "opacity-40" : "hover:scale-105"
            )}
          >
            {c}
          </Card>
        ))}
      </div>
    </div>
  )
}
