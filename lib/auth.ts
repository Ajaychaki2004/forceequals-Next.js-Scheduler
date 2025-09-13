import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect("/api/auth/signin")
  }
  return session
}

export async function requireRole(role: "buyer" | "seller") {
  const session = await requireAuth()
  if (session.user.role !== role) {
    redirect("/")
  }
  return session
}
