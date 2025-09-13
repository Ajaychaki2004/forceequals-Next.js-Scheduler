"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const fetchCollection = async (collection: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/debug/db?collection=${collection}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }
  
  const resetAuthData = async () => {
    if (confirm("Are you sure you want to reset all authentication data? This will log out all users.")) {
      setLoading(true)
      try {
        const response = await fetch('/api/debug/reset', { method: 'POST' })
        const result = await response.json()
        setMessage(result.message || "Reset completed")
        setData(null)
      } catch (error) {
        console.error("Error resetting auth data:", error)
        setMessage("Error resetting data")
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Database Debug</h1>
      <div className="flex gap-4 mb-4">
        <Button onClick={() => fetchCollection("users")} disabled={loading}>
          View Users
        </Button>
        <Button onClick={() => fetchCollection("accounts")} disabled={loading}>
          View Accounts
        </Button>
        <Button onClick={() => fetchCollection("sessions")} disabled={loading}>
          View Sessions
        </Button>
        <Button onClick={resetAuthData} disabled={loading} variant="destructive">
          Reset Auth Data
        </Button>
      </div>
      {loading && <p>Loading...</p>}
      {message && <div className="bg-green-100 text-green-800 p-3 rounded mb-4">{message}</div>}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Database Records</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded text-sm overflow-auto max-h-[500px]">
              {JSON.stringify(data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}