"use client"

import type React from "react"

import { useEffect, useState } from "react"
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
  const [grade, setGrade] = useState("grade1")
  const [subject, setSubject] = useState("math")
  const [isActive, setIsActive] = useState(true)
  const [hintEnabled, setHintEnabled] = useState(false)
  const [hintText, setHintText] = useState("")
  const [imageEnabled, setImageEnabled] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [draftEnabled, setDraftEnabled] = useState(false)
  const [questionType, setQuestionType] = useState<"matching" | "choice" | "poem_fill" | "fill_blank">("matching")
  const [blanks, setBlanks] = useState<Array<{ idx: number; answer_text: string; hint?: string }>>([])
  const [poems, setPoems] = useState<{ id: number; title: string; author: string; dynasty: string }[]>([])
  const [poemId, setPoemId] = useState<number | null>(null)
  const [leftItems, setLeftItems] = useState<QuestionItem[]>([{ content: "", side: "left", display_order: 1 }])
  const [rightItems, setRightItems] = useState<QuestionItem[]>([{ content: "", side: "right", display_order: 1 }])
  const [choiceOptions, setChoiceOptions] = useState<ChoiceOption[]>([
    { content: "", is_correct: false, display_order: 1 },
    { content: "", is_correct: false, display_order: 2 },
    { content: "", is_correct: false, display_order: 3 },
    { content: "", is_correct: false, display_order: 4 }
  ])
  const [previewFormula, setPreviewFormula] = useState("")
  const [previewAnswerFill, setPreviewAnswerFill] = useState("")
  const [previewDescriptionShell, setPreviewDescriptionShell] = useState("")
  const [loading, setLoading] = useState(false)

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
    if (questionType === "poem_fill") {
      loadPoems()
    }
  }, [questionType])

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
    } else if (questionType === "choice") {
      if (choiceOptions.some((option) => !option.content)) {
        alert("请填写所有选项内容")
        return
      }
      if (!choiceOptions.some((option) => option.is_correct)) {
        alert("请至少选择一个正确答案")
        return
      }
    } else if (questionType === "fill_blank") {
      if (blanks.length === 0) {
        alert("请添加至少一个空位")
        return
      }
      const text = description || ""
      const found: number[] = []
      const re = /\{_([0-9]+)\}/g
      let m
      while ((m = re.exec(text)) != null) {
        const idx = parseInt(m[1], 10)
        if (!found.includes(idx)) found.push(idx)
      }
      const missing = blanks.some((b) => !found.includes(b.idx)) || found.some((i) => !blanks.some((b) => b.idx === i))
      if (missing) {
        alert("题干占位符与空位索引不一致，请同步空位")
        return
      }
      if (blanks.some((b) => !b.answer_text)) {
        alert("请填写所有空位答案")
        return
      }
    } else if (questionType === "poem_fill") {
      if (!poemId) {
        alert("请选择古诗")
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
            grade,
            subject,
            is_active: isActive,
            type: "matching",
            items,
            hint_enabled: hintEnabled,
            hint_text: hintText,
            image_enabled: imageEnabled,
            image_url: imageUrl,
            draft_enabled: draftEnabled,
          }),
        })

        if (!response.ok) throw new Error("Failed to create question")
      } else if (questionType === "choice") {
        const response = await fetch("/api/admin/questions/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            difficulty_level: difficultyLevel,
            grade,
            subject,
            is_active: isActive,
            type: "choice",
            options: choiceOptions,
            hint_enabled: hintEnabled,
            hint_text: hintText,
            image_enabled: imageEnabled,
            image_url: imageUrl,
            draft_enabled: draftEnabled,
          }),
        })

        if (!response.ok) throw new Error("Failed to create question")
      } else if (questionType === "poem_fill") {
        if (!poemId) {
          alert("请选择古诗")
          return
        }
        const response = await fetch("/api/admin/questions/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            difficulty_level: difficultyLevel,
            grade,
            subject,
            is_active: isActive,
            type: "poem_fill",
            poem_id: poemId,
            hint_enabled: hintEnabled,
            hint_text: hintText,
            image_enabled: imageEnabled,
            image_url: imageUrl,
            draft_enabled: draftEnabled,
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
            grade,
            subject,
            is_active: isActive,
            type: "fill_blank",
            blanks,
            hint_enabled: hintEnabled,
            hint_text: hintText,
            image_enabled: imageEnabled,
            image_url: imageUrl,
            draft_enabled: draftEnabled,
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
              <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label>草稿功能</Label>
                <div className="flex items-center gap-2">
                  <Checkbox id="draft-enabled" checked={draftEnabled} onCheckedChange={(v) => setDraftEnabled(!!v)} />
                  <Label htmlFor="draft-enabled">启用草稿</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => { 
                    setDescription(e.target.value); 
                    setPreviewFormula(e.target.value);
                    if (questionType === "fill_blank") {
                      const shell = (e.target.value || "").replace(/\{_([0-9]+)\}/g, "（）")
                      setPreviewDescriptionShell(shell)
                    }
                  }}
                  placeholder="支持数学公式：使用 \\( \\) 包裹行内、使用 \\[ \\] 包裹块级"
                  required
                />
                {questionType === "fill_blank" && previewDescriptionShell && (
                  <div className="rounded-md border p-4 bg-slate-50">
                    <p className="text-sm text-slate-500 mb-2">题干预览：</p>
                    <div className="text-base leading-relaxed">
                      {renderMathContent(previewDescriptionShell, "add-fill-preview")}
                    </div>
                  </div>
                )}
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
                      <SelectItem value="error_prone">易错题</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="question-type">题目类型</Label>
                  <Select value={questionType} onValueChange={(value: any) => setQuestionType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择题目类型" />
                    </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matching">连线题</SelectItem>
                    <SelectItem value="choice">选择题</SelectItem>
                    <SelectItem value="poem_fill">古诗填空</SelectItem>
                    <SelectItem value="fill_blank">填空题</SelectItem>
                  </SelectContent>
                  </Select>
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
              ) : questionType === "choice" ? (
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
                          if (questionType === "fill_blank") {
                            const replaced = (e.target.value || "").replace(/\{_([0-9]+)\}/g, (m, p1) => {
                              const idx = parseInt(p1, 10)
                              const f = blanks.find((b) => b.idx === idx)
                              return f && f.answer_text ? f.answer_text : "____"
                            })
                            setPreviewDescriptionFill(replaced)
                          }
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
              ) : questionType === "poem_fill" ? (
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
                    <p className="text-sm text-slate-500">提交后将生成古诗填空题，作答页面按规则展示。</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">
                      在描述中用占位符 <span className="font-mono">{'{_0}'}</span>, <span className="font-mono">{'{_1}'}</span> 标注空位。点击下方“同步空位”从题干解析索引。
                    </p>
                  <div className="flex gap-2">
                      <Button type="button" onClick={() => {
                        const text = description || ""
                        const found: number[] = []
                        const re = /\{_([0-9]+)\}/g
                        let m
                        while ((m = re.exec(text)) != null) {
                          const idx = parseInt(m[1], 10)
                          if (!found.includes(idx)) found.push(idx)
                        }
                        found.sort((a,b)=>a-b)
                        const nextBlanks = found.map((i) => ({ idx: i, answer_text: blanks.find(b=>b.idx===i)?.answer_text || "", hint: blanks.find(b=>b.idx===i)?.hint || "" }))
                        setBlanks(nextBlanks)
                        const replaced = (description || "").replace(/\{_([0-9]+)\}/g, (m, p1) => {
                          const idx = parseInt(p1, 10)
                          const f = nextBlanks.find(b=>b.idx===idx)
                          return f && f.answer_text ? f.answer_text : "____"
                        })
                        setPreviewAnswerFill(replaced)
                      }}>同步空位</Button>
                      <Button type="button" variant="outline" onClick={() => setBlanks([...blanks, { idx: blanks.length, answer_text: "" }])}>新增空位</Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {blanks.map((b, i) => (
                      <div key={`blank-${i}`} className="grid grid-cols-6 gap-2 items-center">
                        <Label>索引</Label>
                        <Input value={String(b.idx)} onChange={(e)=>{
                          const v = parseInt(e.target.value || "0", 10)
                          const copy = [...blanks]; copy[i] = { ...copy[i], idx: v }; setBlanks(copy)
                        }} />
                        <Label>答案</Label>
                        <Input className="col-span-2" value={b.answer_text} onChange={(e)=>{
                          const copy = [...blanks]; copy[i] = { ...copy[i], answer_text: e.target.value }; setBlanks(copy)
                          const replaced = (description || "").replace(/\{_([0-9]+)\}/g, (m, p1) => {
                            const idx = parseInt(p1, 10)
                            const f = copy.find(b=>b.idx===idx)
                            return f && f.answer_text ? f.answer_text : "____"
                          })
                          setPreviewAnswerFill(replaced)
                        }} />
                        <Button type="button" variant="outline" size="sm" onClick={() => setPreviewAnswerFill(b.answer_text)}>预览公式</Button>
                        <Button variant="ghost" size="icon" onClick={() => setBlanks(blanks.filter((_,x)=>x!==i))}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    ))}
                    {questionType === "fill_blank" && previewAnswerFill && (
                      <div className="rounded-md border p-3 bg-slate-50">
                        <div className="mb-2 text-sm text-slate-500">答案预览：</div>
                        <div className="text-base leading-relaxed">
                          {renderMathContent(previewAnswerFill, "add-fill-answer-preview")}
                        </div>
                      </div>
                    )}
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
