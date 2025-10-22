"use client"

import { useState, useEffect } from "react"
import { MatchingGame } from "@/components/matching-game"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const response = await fetch("/api/questions")
        if (!response.ok) {
          throw new Error("Failed to fetch questions")
        }
        const data = await response.json()
        setQuestions(data.questions)
      } catch (err) {
        console.error("[v0] Error fetching questions:", err)
        setError("加载题目失败，请刷新页面重试")
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [])

  const handleComplete = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(score + 1)
    }
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handleRestart = () => {
    setCurrentQuestion(0)
    setScore(0)
  }

  const isLastQuestion = currentQuestion === questions.length - 1

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mb-4 text-4xl">⏳</div>
              <p className="text-muted-foreground text-xl">正在加载题目...</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mb-4 text-4xl">❌</div>
              <p className="text-destructive text-xl">{error}</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (questions.length === 0) {
    return (
      <main className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mb-4 text-4xl">📝</div>
              <p className="text-muted-foreground text-xl">暂时没有题目</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 text-center">
          <h1 className="mb-2 font-bold text-4xl text-primary md:text-5xl">连线游戏</h1>
          <p className="text-muted-foreground text-lg">把左边和右边相关的内容连起来吧！</p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="rounded-full bg-secondary px-6 py-2 font-semibold text-secondary-foreground">
              第 {currentQuestion + 1} 题 / 共 {questions.length} 题
            </div>
            <div className="rounded-full bg-accent px-6 py-2 font-semibold text-accent-foreground">得分: {score}</div>
          </div>
        </header>

        <MatchingGame
          key={questions[currentQuestion].id}
          question={questions[currentQuestion]}
          onComplete={handleComplete}
        />

        <div className="mt-8 flex justify-center gap-4">
          {!isLastQuestion ? (
            <Button
              onClick={handleNext}
              size="lg"
              className="bg-primary px-8 font-bold text-lg text-primary-foreground hover:bg-primary/90"
            >
              下一题
            </Button>
          ) : (
            <Button
              onClick={handleRestart}
              size="lg"
              className="bg-accent px-8 font-bold text-lg text-accent-foreground hover:bg-accent/90"
            >
              重新开始
            </Button>
          )}
        </div>
      </div>
    </main>
  )
}
