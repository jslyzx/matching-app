"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
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
  id?: number
  content: string
  side: "left" | "right"
  display_order: number
  matchIndex?: number
  match_item_id?: number
}

interface ChoiceOption {
  id?: number
  content: string
  is_correct: boolean
  display_order: number
}

export default function EditQuestionPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [difficultyLevel, setDifficultyLevel] = useState("easy")
  const [grade, setGrade] = useState("grade1")
  const [subject, setSubject] = useState("math")
  const [isActive, setIsActive] = useState(true)
  const [hintEnabled, setHintEnabled] = useState(false)
  const [hintText, setHintText] = useState("")
  const [imageEnabled, setImageEnabled] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [draftEnabled, setDraftEnabled] = useState(false)
  const [questionType, setQuestionType] = useState<"matching" | "choice" | "poem_fill">("matching")
  const [poems, setPoems] = useState<{ id: number; title: string; author: string; dynasty: string }[]>([])
  const [poemId, setPoemId] = useState<number | null>(null)
  const [leftItems, setLeftItems] = useState<QuestionItem[]>([])
  const [rightItems, setRightItems] = useState<QuestionItem[]>([])
  const [choiceOptions, setChoiceOptions] = useState<ChoiceOption[]>([])
  const [previewFormula, setPreviewFormula] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchQuestion()
  }, [])

  useEffect(() => {
    async function loadPoems() {
      try {
        const res = await fetch(`/api/admin/poems?limit=50&page=1`)
        if (!res.ok) return
        const data = await res.json()
        const items = (data.poems || []) as any[]
        const mapped = items.map((p) => ({ id: p.id, title: p.title, author: p.author, dynasty: p.dynasty }))
        setPoems(mapped)
      } catch {}
    }
    loadPoems()
  }, [])

  const fetchQuestion = async () => {
    try {
      const response = await fetch(`/api/admin/questions/${id}`)
      if (!response.ok) throw new Error("Failed to fetch")

      const data = await response.json()
      console.log("Fetched question data:", data)
      
      // 基本信息初始化
      setTitle(data.question.title || "")
      setDescription(data.question.description || "")
      setDifficultyLevel(data.question.difficulty_level || "easy")
      setGrade(data.question.grade || "grade1")
      setSubject(data.question.subject || "math")
      setIsActive(data.question.is_active === 1 || false)
      setHintEnabled(!!data.question.hint_enabled)
      setHintText(data.question.hint_text || "")
      setImageEnabled(!!data.question.image_enabled)
      setImageUrl(data.question.image_url || "")
      setDraftEnabled(!!data.question.draft_enabled)
      setQuestionType(data.question.question_type || "matching")
      if (data.question.question_type === "poem_fill") {
        setPoemId(data.question.poem_id || null)
      }

      if (data.question.question_type === "choice") {
        // 处理选择题选项
        if (data.options && Array.isArray(data.options) && data.options.length > 0) {
          // 确保选项按顺序排序
          const sortedOptions = [...data.options].sort((a: any, b: any) => 
            (a.display_order || 0) - (b.display_order || 0)
          )
          
          setChoiceOptions(sortedOptions.map((option: any) => ({
            id: option.id,
            content: option.content || "",
            is_correct: option.is_correct === 1 || option.is_correct === true,
            display_order: option.display_order || 0
          })))
        } else {
          // 如果没有选项数据，添加默认的4个选项
          setChoiceOptions([
            { content: "", is_correct: false, display_order: 1 },
            { content: "", is_correct: false, display_order: 2 },
            { content: "", is_correct: false, display_order: 3 },
            { content: "", is_correct: false, display_order: 4 }
          ])
        }
        // 清空连线题数据
        setLeftItems([])
        setRightItems([])
      } else if (data.question.question_type === "choice") {
        // 清空连线题数据
        setLeftItems([])
        setRightItems([])
      } else {
        // 处理连线题
        const left = (data.items || []).filter((item: any) => item && item.side === "left")
        const right = (data.items || []).filter((item: any) => item && item.side === "right")

        // Set match indices for left items
        const leftWithMatch = left.map((item: any) => {
          const matchIndex = right.findIndex((r: any) => r && r.id === item.match_item_id)
          return {
            ...item,
            matchIndex: matchIndex !== -1 ? matchIndex + 1 : undefined // +1 因为UI中的选项是从1开始计数的
          }
        })

        setLeftItems(leftWithMatch.length > 0 ? leftWithMatch : [{ content: "", side: "left", display_order: 1 }])
        setRightItems(right.length > 0 ? right : [{ content: "", side: "right", display_order: 1 }])
        setChoiceOptions([])
      }
    } catch (error) {
      console.error("Error fetching question:", error)
      alert("加载失败，请重试")
      router.push("/admin")
    } finally {
      setLoading(false)
    }
  }

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

    // 根据题目类型进行不同的验证和提交
    if (questionType === "matching") {
      if (leftItems.some((item) => !item.content) || rightItems.some((item) => !item.content)) {
        alert("请填写所有匹配项内容")
        return
      }

      if (leftItems.some((item) => item.matchIndex === undefined)) {
        alert("请为所有左侧项设置匹配关系")
        return
      }
    } else if (questionType === "choice") {
      if (choiceOptions.length === 0) {
        alert("请添加至少一个选项")
        return
      }

      if (choiceOptions.some((option) => !option.content)) {
        alert("请填写所有选项内容")
        return
      }

      if (!choiceOptions.some((option) => option.is_correct)) {
        alert("请至少选择一个正确答案")
        return
      }
    }

    setSaving(true)

    try {
      let requestBody = {
        title,
        description,
        difficulty_level: difficultyLevel,
        grade,
        subject,
        is_active: isActive,
        question_type: questionType,
        hint_enabled: hintEnabled,
        hint_text: hintText,
        image_enabled: imageEnabled,
        image_url: imageUrl,
        draft_enabled: draftEnabled,
      }

      // 根据题目类型添加不同的数据
      if (questionType === "matching") {
        // 处理左侧项目，将matchIndex减1
        // 因为UI中显示和选择的是1、2、3，但右侧项数组索引是0、1、2
        const adjustedLeftItems = leftItems.map(item => ({
          ...item,
          matchIndex: item.matchIndex !== undefined ? item.matchIndex - 1 : undefined
        }))
        
        const items = [...adjustedLeftItems, ...rightItems]
        requestBody = { ...requestBody, items }
      } else if (questionType === "choice") {
        requestBody = { ...requestBody, options: choiceOptions }
      } else {
        requestBody = { ...requestBody, poem_id: poemId }
      }

      const response = await fetch(`/api/admin/questions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) throw new Error("Failed to update question")

      alert("题目更新成功")
      router.push("/admin")
    } catch (error) {
      console.error(error)
      alert("更新失败，请重试")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">加载中...</div>
      </div>
    )
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
            <CardTitle className="text-2xl">编辑题目</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Same form fields as add page */}
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

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="questionType">题目类型</Label>
                  <Select value={questionType} onValueChange={setQuestionType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="matching">匹配题</SelectItem>
                      <SelectItem value="choice">选择题</SelectItem>
                      <SelectItem value="poem_fill">古诗填空</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>提示</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox id="hint-enabled" checked={hintEnabled} onCheckedChange={(v) => setHintEnabled(!!v)} />
                    <Label htmlFor="hint-enabled">启用提示</Label>
                  </div>
                  {hintEnabled && (
                    <Textarea value={hintText} onChange={(e) => setHintText(e.target.value)} placeholder="输入提示内容" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="difficulty">难度等级</Label>
                  <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">简单</SelectItem>
                      <SelectItem value="medium">中等</SelectItem>
                      <SelectItem value="hard">困难</SelectItem>
                      <SelectItem value="error_prone">易错题</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">状态</Label>
                  <Select value={isActive ? "active" : "inactive"} onValueChange={(v) => setIsActive(v === "active")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">启用</SelectItem>
                      <SelectItem value="inactive">禁用</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>图片</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox id="image-enabled" checked={imageEnabled} onCheckedChange={(v) => setImageEnabled(!!v)} />
                    <Label htmlFor="image-enabled">启用图片</Label>
                  </div>
                  {imageEnabled && (
                    <div className="space-y-2">
                      <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="图片URL" />
                      {imageUrl && (
                        <div className="border rounded p-2">
                          <img src={imageUrl} alt="预览" className="max-h-40 object-contain" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade">年级</Label>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择年级" />
                    </SelectTrigger>
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
                <div className="space-y-2">
                  <Label htmlFor="subject">科目</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择科目" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="math">数学</SelectItem>
                      <SelectItem value="chinese">语文</SelectItem>
                      <SelectItem value="english">英语</SelectItem>
                      <SelectItem value="science">科学</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>草稿功能</Label>
                <div className="flex items-center gap-2">
                  <Checkbox id="draft-enabled" checked={draftEnabled} onCheckedChange={(v) => setDraftEnabled(!!v)} />
                  <Label htmlFor="draft-enabled">启用草稿</Label>
                </div>
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
                              <SelectItem key={`match-${i}`} value={(i + 1).toString()}>
                                右侧{i + 1}
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
              ) : questionType === "choice" ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>选项</Label>
                    <Button type="button" size="sm" onClick={addChoiceOption}>
                      <Plus className="w-4 h-4 mr-1" />
                      添加选项
                    </Button>
                  </div>
                  
                  {choiceOptions.map((option, index) => (
                    <div key={index} className="space-y-3 p-4 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">选项 {index + 1}</span>
                          <div className="flex items-center">
                            <Checkbox 
                              id={`correct-${index}`}
                              checked={option.is_correct}
                              onCheckedChange={() => toggleCorrectOption(index)}
                            />
                            <Label htmlFor={`correct-${index}`} className="ml-2 text-sm">
                              正确答案
                            </Label>
                          </div>
                        </div>
                        {choiceOptions.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeChoiceOption(index)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                      
                      <Textarea
                        value={option.content}
                        onChange={(e) => updateChoiceOption(index, "content", e.target.value)}
                        placeholder="选项内容（支持数学公式，使用 \( \) 或 \[ \] 包裹）"
                        className="min-h-[80px]"
                      />
                      
                      <div className="flex justify-end">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleFormulaPreview(option.content)}
                        >
                          预览公式
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {previewFormula && (
                    <div className="mt-4 p-4 border rounded-lg bg-slate-50">
                      <div className="mb-2 font-medium">公式预览：</div>
                      <div className="text-base leading-relaxed">
                        {renderMathContent(previewFormula, "edit-preview")}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="poem">选择古诗</Label>
                    <Select value={poemId ? String(poemId) : ""} onValueChange={(v) => setPoemId(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择古诗" />
                      </SelectTrigger>
                      <SelectContent>
                        {poems.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.title}（{p.dynasty}·{p.author}）
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-slate-500">保存后题目将作为古诗填空题。</p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => router.push("/admin")}>
                  取消
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "保存中..." : "保存修改"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
