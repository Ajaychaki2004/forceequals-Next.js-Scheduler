"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "./ui/button"
import { Loader2 } from "lucide-react"
import { ExtendedSession, UserRole } from "@/types/auth"

export function RoleSwitcher() {
  const { data: session, update } = useSession() as { 
    data: ExtendedSession | null, 
    update: () => Promise<ExtendedSession | null> 
  }
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Check if user is logged in
  if (!session?.user) return null

  const currentRole = session.user.role || "buyer" as UserRole
  const newRole = currentRole === "buyer" ? "seller" : "buyer" as UserRole

  const handleRoleSwitch = async () => {
    setIsLoading(true)
    try {
      // Store new role in sessionStorage
      sessionStorage.setItem('selectedRole', newRole)
      console.log(`Role switch: stored ${newRole} in sessionStorage`)
      
      // Call API to update role
      const response = await fetch("/api/auth/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        throw new Error("Failed to update role")
      }

      // Update session
      await update()

      // Reload the page to make sure everything refreshes
      // This works better than just redirecting, as it ensures the session is fully updated
      window.location.href = newRole === "seller" 
        ? "/seller/dashboard" 
        : "/buyer/appointment"
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
      className="text-xs"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Switching...
        </>
      ) : (
        <>Switch to {newRole} mode</>
      )}
    </Button>
  )
}