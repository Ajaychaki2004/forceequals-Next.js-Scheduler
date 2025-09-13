"use client"

import type React from "react"
import { SessionProvider } from "next-auth/react"
import { RoleUpdater } from "./role-updater-client"
import RoleParamHandler from "./role-param-handler"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <RoleParamHandler />
      <RoleUpdater />
      {children}
    </SessionProvider>
  )
}
