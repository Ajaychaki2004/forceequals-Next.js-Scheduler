"use client"

import { SiteHeader } from "@/components/site-header"
import { Suspense } from "react"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<div>Loading...</div>}>
        {children}
      </Suspense>
    </>
  )
}