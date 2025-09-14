"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Calendar, Loader2, CheckCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

// Function to get the refresh token for a user by email
async function getRefreshToken(email: string) {
  try {
    const response = await fetch(`/api/calendar/token?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.refreshToken;
  } catch (error) {
    console.error("Error fetching refresh token:", error);
    return null;
  }
}

interface ConnectCalendarButtonProps {
  onConnect?: () => void
  refreshToken?: string
  isConnected?: boolean
}

export function ConnectCalendarButton({ 
  onConnect, 
  refreshToken: initialRefreshToken,
  isConnected: initialIsConnected = false
}: ConnectCalendarButtonProps) {
  const { data: session, update } = useSession()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(initialIsConnected)
  
  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      if (!session?.user) {
        // Not signed in - redirect to sign in
        window.location.href = "/api/auth/signin?callbackUrl=/seller/dashboard&role=seller&prompt=consent"
        return
      }
      
      // Get the token from props or try to get it from the API
      const refreshToken = initialRefreshToken || (session.user.email && await getRefreshToken(session.user.email))
      
      if (refreshToken) {
        // We already have a token, so just connect the calendar
        const response = await fetch("/api/calendar/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        })
        
        if (response.ok) {
          setIsConnected(true)
          toast({
            title: "Calendar connected",
            description: "Your Google Calendar has been connected successfully",
            variant: "default",
          })
          // Update the session to reflect the change
          await update()
          if (onConnect) onConnect()
        } else {
          const data = await response.json()
          toast({
            title: "Failed to connect calendar",
            description: data.error || "Please try again later",
            variant: "destructive",
          })
        }
      } else {
        // No token, so trigger the OAuth flow
        window.location.href = "/api/auth/signin?callbackUrl=/seller/dashboard&role=seller&prompt=consent"
      }
    } catch (error) {
      console.error("Error connecting calendar:", error)
      toast({
        title: "Error",
        description: "Failed to connect calendar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <Button 
      onClick={handleConnect} 
      disabled={isConnecting || isConnected} 
      className="flex items-center gap-2"
      variant={isConnected ? "outline" : "default"}
    >
      {isConnecting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isConnected ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <Calendar className="h-4 w-4" />
      )}
      {isConnecting 
        ? "Connecting..." 
        : isConnected 
          ? "Calendar Connected" 
          : "Connect Calendar"
      }
    </Button>
  )
}
