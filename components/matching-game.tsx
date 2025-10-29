"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { renderMathContent } from "@/components/math-formula"
import { cn } from "@/lib/utils"

interface Item {
  id: string
  text: string
  value: string
}

interface Question {
  id: number
  title: string
  leftItems: Item[]
  rightItems: Item[]
}

interface MatchingGameProps {
  question: Question
  onComplete: (isCorrect: boolean) => void
}

interface Connection {
  leftId: string
  rightId: string
  leftValue: string
  rightValue: string
}

export function MatchingGame({ question, onComplete }: MatchingGameProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const leftRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const rightRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // 绘制连线
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 设置画布大小
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制所有连线
    connections.forEach((connection) => {
      const leftEl = leftRefs.current[connection.leftId]
      const rightEl = rightRefs.current[connection.rightId]

      if (leftEl && rightEl) {
        const leftRect = leftEl.getBoundingClientRect()
        const rightRect = rightEl.getBoundingClientRect()
        const canvasRect = canvas.getBoundingClientRect()

        const startX = leftRect.right - canvasRect.left
        const startY = leftRect.top + leftRect.height / 2 - canvasRect.top
        const endX = rightRect.left - canvasRect.left
        const endY = rightRect.top + rightRect.height / 2 - canvasRect.top

        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.strokeStyle = connection.leftValue === connection.rightValue ? "#22c55e" : "#ef4444"
        ctx.lineWidth = 4
        ctx.lineCap = "round"
        ctx.stroke()
      }
    })
  }, [connections])

  const handleLeftClick = (item: Item) => {
    setSelectedLeft(item.id)
  }

  const handleRightClick = (item: Item) => {
    if (!selectedLeft) return

    const leftItem = question.leftItems.find((i) => i.id === selectedLeft)
    if (!leftItem) return

    // 检查是否已经连接过
    const existingConnection = connections.find((c) => c.leftId === selectedLeft || c.rightId === item.id)
    if (existingConnection) {
      // 移除旧连接
      setConnections(connections.filter((c) => c.leftId !== selectedLeft && c.rightId !== item.id))
    }

    // 添加新连接
    const newConnection: Connection = {
      leftId: selectedLeft,
      rightId: item.id,
      leftValue: leftItem.value,
      rightValue: item.value,
    }
    setConnections([...connections.filter((c) => c.leftId !== selectedLeft && c.rightId !== item.id), newConnection])
    setSelectedLeft(null)

    // 检查是否完成所有连接
    if (connections.length + 1 === question.leftItems.length) {
      checkAnswers([...connections.filter((c) => c.leftId !== selectedLeft && c.rightId !== item.id), newConnection])
    }
  }

  const checkAnswers = (allConnections: Connection[]) => {
    const allCorrect = allConnections.every((c) => c.leftValue === c.rightValue)
    setFeedback(allCorrect ? "correct" : "incorrect")
    onComplete(allCorrect)
  }

  const handleRetry = () => {
    setConnections([])
    setSelectedLeft(null)
    setFeedback(null)
  }

  const isConnected = (itemId: string) => {
    return connections.some((c) => c.leftId === itemId || c.rightId === itemId)
  }

  return (
    <div className="relative">
      <h2 className="mb-6 text-center font-bold text-2xl text-foreground md:text-3xl">
        {renderMathContent(question.title, "matching-title")}
      </h2>

      <div className="relative grid grid-cols-[1fr_auto_1fr] gap-4 md:gap-8">
        {/* 左列 */}
        <div className="flex flex-col gap-4">
          {question.leftItems.map((item) => (
            <Card
              key={item.id}
              ref={(el) => {
                leftRefs.current[item.id] = el
              }}
              onClick={() => handleLeftClick(item)}
              className={cn(
                "cursor-pointer border-4 p-4 text-center font-semibold text-lg transition-all hover:scale-105 md:p-6 md:text-xl",
                selectedLeft === item.id && "border-primary bg-primary/10",
                isConnected(item.id) && "border-accent bg-accent/10",
              )}
            >
              {renderMathContent(item.text, `matching-left-${item.id}`)}
            </Card>
          ))}
        </div>

        {/* 画布区域 */}
        <div className="relative w-16 md:w-32">
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ pointerEvents: "none" }} />
        </div>

        {/* 右列 */}
        <div className="flex flex-col gap-4">
          {question.rightItems.map((item) => (
            <Card
              key={item.id}
              ref={(el) => {
                rightRefs.current[item.id] = el
              }}
              onClick={() => handleRightClick(item)}
              className={cn(
                "cursor-pointer border-4 p-4 text-center font-semibold text-lg transition-all hover:scale-105 md:p-6 md:text-xl",
                isConnected(item.id) && "border-accent bg-accent/10",
              )}
            >
              {renderMathContent(item.text, `matching-right-${item.id}`)}
            </Card>
          ))}
        </div>
      </div>

      {/* 反馈信息 */}
      {feedback && (
        <div
          className={cn(
            "mt-6 rounded-2xl p-6 text-center font-bold text-2xl",
            feedback === "correct" && "bg-accent text-accent-foreground",
            feedback === "incorrect" && "bg-red-500 text-white",
          )}
        >
          <div className="mb-4">{feedback === "correct" ? "太棒了！全部正确！" : "有些答案不对哦！"}</div>
          {feedback === "incorrect" && (
            <button
              onClick={handleRetry}
              className="rounded-xl bg-white px-8 py-3 font-bold text-lg text-red-500 transition-transform hover:scale-105 active:scale-95"
            >
              再试一次
            </button>
          )}
        </div>
      )}
    </div>
  )
}
