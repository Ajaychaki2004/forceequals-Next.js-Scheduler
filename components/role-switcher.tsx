"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "./ui/button"

export function RoleSwitcher() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // @ts-ignore - We know our session has a role field
  const currentRole = session?.user?.role || "buyer"
  const newRole = currentRole === "buyer" ? "seller" : "buyer"

  const handleRoleSwitch = async () => {
    setIsLoading(true)
    try {
      // Update role in the database
      const response = await fetch("/api/auth/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        throw new Error("Failed to update role")
      }

      // Update the session
      await update()

      // Redirect to the appropriate dashboard
      if (newRole === "seller") {
        router.push("/seller/dashboard")
      } else {
        router.push("/buyer/appointment")
      }
    } catch (error) {
      console.error("Failed to switch role:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleRoleSwitch} 
      variant="outline" 
      size="sm" 
      disabled={isLoading}
    >
      {isLoading ? "Switching..." : `Switch to ${newRole} mode`}
    </Button>
  )
}