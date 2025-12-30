"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Save, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const GENRES = [
  { value: "五言绝句", label: "五言绝句" },
  { value: "七言绝句", label: "七言绝句" },
  { value: "五言律诗", label: "五言律诗" },
  { value: "七言律诗", label: "七言律诗" },
  { value: "其他", label: "其他" },
];

export default function AddPoemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    dynasty: "",
    genre: "其他",
    content: "",
    is_active: true,
  });

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    console.log("handleSearch triggered, title:", formData.title);
    if (!formData.title.trim()) {
      console.log("Title is empty");
      toast({ title: "提示", description: "请输入搜索关键词（标题/作者）" });
      return;
    }
    setSearching(true);
    setSearchOpen(true);
    console.log("Fetching search results...");
    try {
      const res = await fetch(
        `/api/poems/search?keyword=${encodeURIComponent(formData.title)}`
      );
      if (!res.ok) console.error("Fetch error:", res.status);
      const data = await res.json();
      console.log("Search results:", data);
      setSearchResults(data.poems || []);
    } catch (e) {
      console.error("Search exception:", e);
      toast({ title: "错误", description: "搜索失败", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const selectPoem = (poem: any) => {
    setFormData((prev) => ({
      ...prev,
      title: poem.title,
      author: poem.author,
      dynasty: poem.dynasty,
      genre: poem.genre || "其他",
      content: poem.content,
    }));
    setSearchOpen(false);
    toast({ title: "已自动填充", description: `已选择：${poem.title}` });
  };

  const splitContentIntoLines = (content: string): string[] => {
    return content
      .split(/[。！？；]/g)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: "错误",
        description: "请输入诗题",
        variant: "destructive",
      });
      return;
    }

    if (!formData.author.trim()) {
      toast({
        title: "错误",
        description: "请输入作者",
        variant: "destructive",
      });
      return;
    }

    if (!formData.dynasty.trim()) {
      toast({
        title: "错误",
        description: "请输入朝代",
        variant: "destructive",
      });
      return;
    }

    if (!formData.content.trim()) {
      toast({
        title: "错误",
        description: "请输入诗文内容",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const contentLines = splitContentIntoLines(formData.content);

      const response = await fetch("/api/admin/poems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          content_lines: contentLines,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "添加失败");
      }

      toast({
        title: "成功",
        description: "古诗添加成功",
      });

      router.push("/admin/poems");
    } catch (error) {
      toast({
        title: "错误",
        description:
          error instanceof Error ? error.message : "添加失败，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-bold">新增古诗</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">诗题 *</Label>
                <div className="flex gap-2">
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="请输入诗题"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSearch}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    联网搜索
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">作者 *</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, author: e.target.value }))
                  }
                  placeholder="请输入作者"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dynasty">朝代 *</Label>
                <Input
                  id="dynasty"
                  value={formData.dynasty}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      dynasty: e.target.value,
                    }))
                  }
                  placeholder="请输入朝代，如：唐、宋、明等"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="genre">体裁 *</Label>
                <Select
                  value={formData.genre}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, genre: value }))
                  }
                >
                  <SelectTrigger id="genre">
                    <SelectValue placeholder="请选择体裁" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRES.map((genre) => (
                      <SelectItem key={genre.value} value={genre.value}>
                        {genre.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">诗文内容 *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="请输入完整的诗文内容，系统将自动按句拆分"
                rows={8}
                required
              />
              <p className="text-sm text-gray-500">
                提示：系统会根据句号、感叹号、问号、分号等标点符号自动拆分诗句
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_active: e.target.checked,
                  }))
                }
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_active" className="text-sm font-medium">
                立即启用
              </Label>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "保存中..." : "保存"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>搜索结果</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {searching ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                搜索中...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                未找到相关古诗，请尝试其他关键词
              </div>
            ) : (
              searchResults.map((poem, idx) => (
                <div
                  key={idx}
                  className="border rounded-xl p-4 cursor-pointer hover:bg-slate-50 hover:border-blue-300 transition-all active:scale-[0.98]"
                  onClick={() => selectPoem(poem)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{poem.title}</h3>
                    <Badge variant="secondary">{poem.dynasty}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    <span className="font-medium text-slate-700">
                      {poem.author}
                    </span>{" "}
                    · {poem.genre}
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                    {poem.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
