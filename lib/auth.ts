import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import roleRoutes from "./role-routes.json"
import { UserRole, ExtendedSession, RoleRoutes } from "@/types/auth"

// Cast the routes JSON to our type definition
const typedRoutes = roleRoutes as unknown as RoleRoutes

export async function requireAuth() {
  // Need to use @ts-ignore because of the custom auth options type
  // @ts-ignore
  const session = await getServerSession(authOptions) as ExtendedSession | null
  if (!session) {
    redirect("/api/auth/signin")
  }
  return session
}

export async function requireRole(role: UserRole) {
  const session = await requireAuth()
  
  if (session.user?.role !== role) {
    // Redirect to the appropriate dashboard based on the user's actual role
    const userRole = session.user?.role || "buyer"
    const redirectPath = typedRoutes.defaultRedirects[userRole] || "/"
    
    redirect(redirectPath)
  }
  
  return session
}
