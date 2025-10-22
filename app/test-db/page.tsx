"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function TestDBPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-db")
      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">数据库连接测试</h1>

        <Button onClick={testConnection} disabled={loading} size="lg">
          {loading ? "测试中..." : "测试数据库连接"}
        </Button>

        {result && (
          <div className="mt-6 p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">{result.success ? "✅ 连接成功" : "❌ 连接失败"}</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
