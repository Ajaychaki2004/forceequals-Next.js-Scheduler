"use client"

import { RoleUpdater } from "./role-updater-client"

export function RoleAwareWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RoleUpdater />
      {children}
    </>
  )
}