"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, Loader2 } from "lucide-react"

interface ConnectCalendarButtonProps {
  onConnect: () => void
}

export function ConnectCalendarButton({ onConnect }: ConnectCalendarButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      // Trigger OAuth flow for calendar permissions
      window.location.href = "/api/auth/signin?callbackUrl=/seller/dashboard&prompt=consent"
    } catch (error) {
      console.error("Error connecting calendar:", error)
      setIsConnecting(false)
    }
  }

  return (
    <Button onClick={handleConnect} disabled={isConnecting} className="flex items-center gap-2">
      {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
      {isConnecting ? "Connecting..." : "Connect Calendar"}
    </Button>
  )
}
