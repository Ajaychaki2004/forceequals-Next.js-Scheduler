"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"

// Extend the Session type for TypeScript
interface ExtendedUser {
  role?: string;
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface ExtendedSession {
  user?: ExtendedUser;
  expires: string;
}

export function RoleUpdater() {
  // @ts-ignore - NextAuth session has custom fields
  const { data: session, update } = useSession()
  const searchParams = useSearchParams()
  const role = searchParams.get("role")
  
  useEffect(() => {
    const updateRole = async () => {
      if (role && (role === "buyer" || role === "seller")) {
        // @ts-ignore - We know our session has a custom role field
        if (session?.user?.role !== role) {
          try {
            // Update the role in the session via the update function
            await fetch("/api/auth/update-role", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ role }),
            })
            
            // Update the session
            await update()
          } catch (error) {
            console.error("Failed to update role:", error)
          }
        }
      }
    }
    
    if (session) {
      updateRole()
    }
  }, [session, role, update])
  
  return null // This component doesn't render anything
}