"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, ArrowLeft } from "lucide-react"

interface QuestionItem {
  content: string
  side: "left" | "right"
  display_order: number
  matchIndex?: number
}

export default function AddQuestionPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [difficultyLevel, setDifficultyLevel] = useState("easy")
  const [isActive, setIsActive] = useState(true)
  const [leftItems, setLeftItems] = useState<QuestionItem[]>([{ content: "", side: "left", display_order: 1 }])
  const [rightItems, setRightItems] = useState<QuestionItem[]>([{ content: "", side: "right", display_order: 1 }])
  const [loading, setLoading] = useState(false)

  const addLeftItem = () => {
    setLeftItems([...leftItems, { content: "", side: "left", display_order: leftItems.length + 1 }])
  }

  const addRightItem = () => {
    setRightItems([...rightItems, { content: "", side: "right", display_order: rightItems.length + 1 }])
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !description) {
      alert("请填写标题和描述")
      return
    }

    if (leftItems.some((item) => !item.content) || rightItems.some((item) => !item.content)) {
      alert("请填写所有匹配项内容")
      return
    }

    if (leftItems.some((item) => item.matchIndex === undefined)) {
      alert("请为所有左侧项设置匹配关系")
      return
    }

    setLoading(true)

    try {
      const items = [...leftItems, ...rightItems]
      const response = await fetch("/api/admin/questions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          difficulty_level: difficultyLevel,
          is_active: isActive,
          items,
        }),
      })

      if (!response.ok) throw new Error("Failed to create question")

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
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">简单</SelectItem>
                      <SelectItem value="medium">中等</SelectItem>
                      <SelectItem value="hard">困难</SelectItem>
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
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>左侧匹配项</Label>
                    <Button type="button" size="sm" onClick={addLeftItem}>
                      <Plus className="w-4 h-4 mr-1" />
                      添加
                    </Button>
                  </div>
                  {leftItems.map((item, index) => (
                    <div key={index} className="space-y-2 p-4 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">项目 {index + 1}</span>
                        {leftItems.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeLeftItem(index)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                      <Input
                        value={item.content}
                        onChange={(e) => updateLeftItem(index, "content", e.target.value)}
                        placeholder="内容（支持emoji）"
                      />
                      <Select
                        value={item.matchIndex?.toString()}
                        onValueChange={(v) => updateLeftItem(index, "matchIndex", Number.parseInt(v))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择匹配的右侧项" />
                        </SelectTrigger>
                        <SelectContent>
                          {rightItems.map((_, i) => (
                            <SelectItem key={i} value={(i + 1).toString()}>
                              右侧项目 {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>右侧匹配项</Label>
                    <Button type="button" size="sm" onClick={addRightItem}>
                      <Plus className="w-4 h-4 mr-1" />
                      添加
                    </Button>
                  </div>
                  {rightItems.map((item, index) => (
                    <div key={index} className="space-y-2 p-4 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">项目 {index + 1}</span>
                        {rightItems.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeRightItem(index)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                      <Input
                        value={item.content}
                        onChange={(e) => updateRightItem(index, e.target.value)}
                        placeholder="内容（支持emoji）"
                      />
                    </div>
                  ))}
                </div>
              </div>

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
