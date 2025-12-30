"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts"
import { FileQuestion, BookOpen, ScrollText, Users, ArrowUpRight, Activity } from "lucide-react"

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b']

interface Stats {
  totalQuestions: number
  totalPoems: number
  totalPapers: number
  activeQuestions: number
  questionsBySubject: { name: string; value: number }[]
  recentActivity: { date: string; count: number }[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching data - in real app replace with actual API calls
    // For now we'll mock it to demonstrate the UI
    setTimeout(() => {
      setStats({
        totalQuestions: 156,
        totalPoems: 42,
        totalPapers: 12,
        activeQuestions: 145,
        questionsBySubject: [
          { name: "数学", value: 45 },
          { name: "语文", value: 38 },
          { name: "英语", value: 32 },
          { name: "科学", value: 25 },
          { name: "其他", value: 16 },
        ],
        recentActivity: [
          { date: "周一", count: 12 },
          { date: "周二", count: 18 },
          { date: "周三", count: 15 },
          { date: "周四", count: 24 },
          { date: "周五", count: 20 },
          { date: "周六", count: 8 },
          { date: "周日", count: 10 },
        ]
      })
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-4 w-4 bg-gray-200 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-32 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">仪表盘</h2>
        <p className="text-muted-foreground mt-2">欢迎回来，这里是您的教学内容概览。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="题目总数"
          value={stats?.totalQuestions || 0}
          icon={FileQuestion}
          description="较上月增长 12%"
          trend="up"
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          title="收录古诗"
          value={stats?.totalPoems || 0}
          icon={BookOpen}
          description="新增 3 首古诗"
          trend="up"
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <StatCard
          title="试卷数量"
          value={stats?.totalPapers || 0}
          icon={ScrollText}
          description="待发布 2 套"
          trend="neutral"
          color="text-pink-600"
          bgColor="bg-pink-100"
        />
        <StatCard
          title="活跃题目"
          value={stats?.activeQuestions || 0}
          icon={Activity}
          description="占比 93%"
          trend="up"
          color="text-emerald-600"
          bgColor="bg-emerald-100"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-md border-none ring-1 ring-slate-200 bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>近期录入趋势</CardTitle>
            <CardDescription>过去7天的题目添加数量</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stats?.recentActivity}>
                <XAxis
                  dataKey="date"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar
                  dataKey="count"
                  fill="currentColor"
                  radius={[4, 4, 0, 0]}
                  className="fill-primary"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 shadow-md border-none ring-1 ring-slate-200 bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>学科分布</CardTitle>
            <CardDescription>当前题库学科构成</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.questionsBySubject}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats?.questionsBySubject.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-sm text-muted-foreground mt-4 flex-wrap">
              {stats?.questionsBySubject.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend,
  color,
  bgColor
}: { 
  title: string
  value: number | string
  icon: any
  description: string
  trend?: 'up' | 'down' | 'neutral'
  color: string
  bgColor: string
}) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-none ring-1 ring-slate-200 bg-white/60 backdrop-blur-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-xl ${bgColor}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          {trend === 'up' && <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />}
          {description}
        </div>
      </CardContent>
    </Card>
  )
}
