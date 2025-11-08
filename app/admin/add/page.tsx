"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, ArrowLeft, Check } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { renderMathContent } from "@/components/math-formula"

interface QuestionItem {
  content: string
  side: "left" | "right"
  display_order: number
  matchIndex?: number
}

interface ChoiceOption {
  content: string
  is_correct: boolean
  display_order: number
}

export default function AddQuestionPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [difficultyLevel, setDifficultyLevel] = useState("easy")
  const [isActive, setIsActive] = useState(true)
  const [questionType, setQuestionType] = useState<"matching" | "choice">("matching")
  const [leftItems, setLeftItems] = useState<QuestionItem[]>([{ content: "", side: "left", display_order: 1 }])
  const [rightItems, setRightItems] = useState<QuestionItem[]>([{ content: "", side: "right", display_order: 1 }])
  const [choiceOptions, setChoiceOptions] = useState<ChoiceOption[]>([
    { content: "", is_correct: false, display_order: 1 },
    { content: "", is_correct: false, display_order: 2 },
    { content: "", is_correct: false, display_order: 3 },
    { content: "", is_correct: false, display_order: 4 }
  ])
  const [previewFormula, setPreviewFormula] = useState("")
  const [loading, setLoading] = useState(false)

  const addLeftItem = () => {
    setLeftItems([...leftItems, { content: "", side: "left", display_order: leftItems.length + 1 }])
  }

  const addRightItem = () => {
    setRightItems([...rightItems, { content: "", side: "right", display_order: rightItems.length + 1 }])
  }

  const addChoiceOption = () => {
    setChoiceOptions([
      ...choiceOptions, 
      { content: "", is_correct: false, display_order: choiceOptions.length + 1 }
    ])
  }

  const removeLeftItem = (index: number) => {
    if (leftItems.length > 1) {
      setLeftItems(leftItems.filter((_, i) => i !== index))
    }
  }

  const removeRightItem = (index: number) => {
    if (rightItems.length > 1) {
      setRightItems(rightItems.filter((_, i) => i !== index))
    }
  }

  const removeChoiceOption = (index: number) => {
    if (choiceOptions.length > 2) {
      setChoiceOptions(choiceOptions.filter((_, i) => i !== index))
    }
  }

  const updateLeftItem = (index: number, field: string, value: string | number) => {
    const updated = [...leftItems]
    updated[index] = { ...updated[index], [field]: value }
    setLeftItems(updated)
  }

  const updateRightItem = (index: number, content: string) => {
    const updated = [...rightItems]
    updated[index] = { ...updated[index], content }
    setRightItems(updated)
  }

  const updateChoiceOption = (index: number, field: string, value: string | boolean) => {
    const updated = [...choiceOptions]
    updated[index] = { ...updated[index], [field]: value }
    setChoiceOptions(updated)
  }

  const toggleCorrectOption = (index: number) => {
    const updated = [...choiceOptions]
    updated[index].is_correct = !updated[index].is_correct
    setChoiceOptions(updated)
  }

  const handleFormulaPreview = (formula: string) => {
    setPreviewFormula(formula)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !description) {
      alert("请填写标题和描述")
      return
    }

    if (questionType === "matching") {
      if (leftItems.some((item) => !item.content) || rightItems.some((item) => !item.content)) {
        alert("请填写所有匹配项内容")
        return
      }

      if (leftItems.some((item) => item.matchIndex === undefined)) {
        alert("请为所有左侧项设置匹配关系")
        return
      }
    } else {
      if (choiceOptions.some((option) => !option.content)) {
        alert("请填写所有选项内容")
        return
      }

      if (!choiceOptions.some((option) => option.is_correct)) {
        alert("请至少选择一个正确答案")
        return
      }
    }

    setLoading(true)

    try {
      if (questionType === "matching") {
        // 处理左侧项目，将matchIndex减1
        // 因为UI中显示和选择的是1、2、3，但右侧项数组索引是0、1、2
        const adjustedLeftItems = leftItems.map(item => ({
          ...item,
          matchIndex: item.matchIndex !== undefined ? item.matchIndex - 1 : undefined
        }))
        
        const items = [...adjustedLeftItems, ...rightItems]
        const response = await fetch("/api/admin/questions/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            difficulty_level: difficultyLevel,
            is_active: isActive,
            type: "matching",
            items,
          }),
        })

        if (!response.ok) throw new Error("Failed to create question")
      } else {
        const response = await fetch("/api/admin/questions/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            difficulty_level: difficultyLevel,
            is_active: isActive,
            type: "choice",
            options: choiceOptions,
          }),
        })

        if (!response.ok) throw new Error("Failed to create question")
      }

      alert("题目创建成功")
      router.push("/admin")
    } catch (error) {
      console.error(error)
      alert("创建失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => router.push("/admin")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回列表
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">新增题目</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">标题</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：动物与食物"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="例如：把动物和它们喜欢吃的食物连起来"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">难度等级</Label>
                  <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择难度" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">简单</SelectItem>
                      <SelectItem value="medium">中等</SelectItem>
                      <SelectItem value="hard">困难</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="question-type">题目类型</Label>
                  <Select value={questionType} onValueChange={(value: "matching" | "choice") => setQuestionType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择题目类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="matching">连线题</SelectItem>
                      <SelectItem value="choice">选择题</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="is-active" checked={isActive} onCheckedChange={(checked) => setIsActive(!!checked)} />
                <Label htmlFor="is-active">启用题目</Label>
              </div>

              {questionType === "matching" ? (
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">左侧项目</h3>
                      <Button type="button" size="sm" onClick={addLeftItem}>
                        <Plus className="w-4 h-4 mr-1" />
                        添加
                      </Button>
                    </div>

                    {leftItems.map((item, index) => (
                      <div key={`left-${index}`} className="flex items-center gap-2">
                        <Input
                          value={item.content}
                          onChange={(e) => updateLeftItem(index, "content", e.target.value)}
                          placeholder={`左侧项 ${index + 1}`}
                          className="flex-1"
                        />
                        <Select
                          value={item.matchIndex !== undefined ? String(item.matchIndex) : ""}
                          onValueChange={(value) => updateLeftItem(index, "matchIndex", parseInt(value))}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="匹配" />
                          </SelectTrigger>
                          <SelectContent>
                            {rightItems.map((_, i) => (
                              <SelectItem key={`match-${i}`} value={String(i + 1)}>
                                {i + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeLeftItem(index)}
                          disabled={leftItems.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">右侧项目</h3>
                      <Button type="button" size="sm" onClick={addRightItem}>
                        <Plus className="w-4 h-4 mr-1" />
                        添加
                      </Button>
                    </div>

                    {rightItems.map((item, index) => (
                      <div key={`right-${index}`} className="flex items-center gap-2">
                        <Input
                          value={item.content}
                          onChange={(e) => updateRightItem(index, e.target.value)}
                          placeholder={`右侧项 ${index + 1}`}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeRightItem(index)}
                          disabled={rightItems.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">题目内容（支持数学公式）</h3>
                    </div>
                    <div className="space-y-2">
                      <Textarea
                        value={description}
                        onChange={(e) => {
                          setDescription(e.target.value)
                          handleFormulaPreview(e.target.value)
                        }}
                        placeholder="输入题目内容，使用 \( \) 包裹行内公式，使用 \[ \] 包裹块级公式"
                        className="min-h-[100px]"
                      />
                      {previewFormula && (
                        <div className="rounded-md border p-4 bg-slate-50">
                          <p className="text-sm text-slate-500 mb-2">预览：</p>
                          <div className="text-base leading-relaxed">
                            {renderMathContent(previewFormula, "add-preview")}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">选项</h3>
                      <Button type="button" size="sm" onClick={addChoiceOption}>
                        <Plus className="w-4 h-4 mr-1" />
                        添加选项
                      </Button>
                    </div>

                    {choiceOptions.map((option, index) => (
                      <div key={`option-${index}`} className="flex items-center gap-2">
                        <div 
                          className={`flex items-center justify-center w-8 h-8 rounded-full border ${
                            option.is_correct ? "bg-green-100 border-green-500" : "bg-slate-100"
                          }`}
                          onClick={() => toggleCorrectOption(index)}
                        >
                          {option.is_correct && <Check className="w-4 h-4 text-green-600" />}
                        </div>
                        <Textarea
                          value={option.content}
                          onChange={(e) => updateChoiceOption(index, "content", e.target.value)}
                          placeholder={`选项 ${index + 1}（支持数学公式）`}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeChoiceOption(index)}
                          disabled={choiceOptions.length <= 2}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <p className="text-sm text-slate-500">点击选项前的圆圈标记为正确答案</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => router.push("/admin")}>
                  取消
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "创建中..." : "创建题目"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
