"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { RoleSwitcher } from "./role-switcher-button"
import { Button } from "./ui/button"
import { UserCircle, LogOut } from "lucide-react"
import { ExtendedSession } from "@/types/auth"

export function SiteHeader() {
  const { data: session } = useSession() as { 
    data: ExtendedSession | null
  }
  
  // Check if user is logged in
  const isLoggedIn = !!session?.user

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold">Scheduler</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <RoleSwitcher />
              
              <div className="flex items-center gap-2">
                <span className="text-sm hidden md:inline-block">
                  {session?.user?.email} ({session?.user?.role || 'buyer'})
                </span>
                <Button
                  variant="ghost" 
                  size="icon"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </>
          ) : (
            <Link href="/auth/signin">
              <Button>
                <UserCircle className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}