"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { renderMathContent } from "@/components/math-formula"
import { cn } from "@/lib/utils"

interface Option {
  id: string
  content: string
  isCorrect: boolean
}

interface Question {
  id: number
  title: string
  description?: string
  options: Option[]
}

interface ChoiceQuestionProps {
  question: Question
  onComplete: (isCorrect: boolean) => void
}

export function ChoiceQuestion({ question, onComplete }: ChoiceQuestionProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null)
  const [submitted, setSubmitted] = useState(false)


  const handleOptionClick = (optionId: string) => {
    if (submitted) return

    // 检查是否已经选择了该选项
    if (selectedOptions.includes(optionId)) {
      // 如果已选择，则移除
      setSelectedOptions(selectedOptions.filter((id) => id !== optionId))
    } else {
      // 如果未选择，则添加
      setSelectedOptions([...selectedOptions, optionId])
    }
  }

  const handleSubmit = () => {
    if (selectedOptions.length === 0 || submitted) return

    // 获取所有正确选项的ID
    const correctOptionIds = question.options.filter((option) => option.isCorrect).map((option) => option.id)

    // 检查用户选择是否正确
    const isCorrect =
      selectedOptions.length === correctOptionIds.length &&
      selectedOptions.every((id) => correctOptionIds.includes(id))

    setFeedback(isCorrect ? "correct" : "incorrect")
    setSubmitted(true)
    onComplete(isCorrect)
  }

  const handleRetry = () => {
    setSelectedOptions([])
    setFeedback(null)
    setSubmitted(false)
  }

  return (
    <div className="relative">
      <div className="mb-6 text-center">
        <h2 className="mb-2 font-bold text-2xl text-foreground md:text-3xl">
          {renderMathContent(question.title, "choice-title")}
        </h2>
        {question.description && (
          <div className="text-muted-foreground text-lg">
            {renderMathContent(question.description, "choice-description")}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {question.options.map((option) => (
          <Card
            key={option.id}
            onClick={() => handleOptionClick(option.id)}
            className={cn(
              "cursor-pointer border-4 p-4 text-center font-semibold text-lg transition-all hover:scale-105 md:p-6 md:text-xl",
              selectedOptions.includes(option.id) && !submitted && "border-primary bg-primary/10",
              submitted && selectedOptions.includes(option.id) && option.isCorrect && "border-green-500 bg-green-100",
              submitted && selectedOptions.includes(option.id) && !option.isCorrect && "border-red-500 bg-red-100"
            )}
          >
            {renderMathContent(option.content, `choice-option-${option.id}`)}
          </Card>
        ))}
      </div>

      <div className="mt-8 flex justify-center gap-4">
        {!submitted ? (
          <Button
            onClick={handleSubmit}
            disabled={selectedOptions.length === 0}
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
            "mt-6 rounded-2xl p-6 text-center font-bold text-2xl",
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