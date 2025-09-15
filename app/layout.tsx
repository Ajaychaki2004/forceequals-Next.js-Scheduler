import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/components/auth-provider"
import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Appointment Booking App",
  description: "Book appointments with Google Calendar integration",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <SiteHeaderWrapper />
              <main className="flex-1">{children}</main>
            </div>
          </AuthProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
