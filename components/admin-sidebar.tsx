"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, FileQuestion, BookOpen, ScrollText, Settings, User } from "lucide-react"

const menuItems = [
  {
    title: "仪表盘",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "题目管理",
    href: "/admin/questions",
    icon: FileQuestion,
  },
  {
    title: "古诗管理",
    href: "/admin/poems",
    icon: BookOpen,
  },
  {
    title: "试卷管理",
    href: "/admin/papers",
    icon: ScrollText,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full border-r bg-card/50 backdrop-blur-xl">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          智学管理后台
        </h1>
      </div>
      
      <div className="flex-1 px-4 space-y-2 py-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform duration-300",
                isActive ? "scale-110" : "group-hover:scale-110"
              )} />
              <span className="font-medium">{item.title}</span>
              {isActive && (
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </Link>
          )
        })}
      </div>

      <div className="p-4 border-t bg-card/30">
        <Link 
          href="/admin/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">系统设置</span>
        </Link>
        <div className="flex items-center gap-3 px-4 py-3 mt-2 rounded-xl border bg-card text-card-foreground">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
            A
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">管理员</p>
            <p className="text-xs text-muted-foreground truncate">admin@example.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
