"use client"

import type React from "react"
import { SessionProvider } from "next-auth/react"
import { RoleUpdater } from "./role-updater"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <RoleUpdater />
      {children}
    </SessionProvider>
  )
}
