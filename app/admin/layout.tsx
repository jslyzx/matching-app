import { AdminSidebar } from "@/components/admin-sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="w-64 flex-none fixed inset-y-0 z-50">
        <AdminSidebar />
      </div>
      <main className="flex-1 pl-64 min-h-screen">
        <div className="p-8 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  )
}
