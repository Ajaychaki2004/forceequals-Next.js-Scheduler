import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../[...nextauth]/route"

export async function GET(request: NextRequest) {
  try {
    // Get session information
    // @ts-ignore - Ignoring TypeScript errors with the authOptions
    const session = await getServerSession(authOptions)
    
    // Get the role cookie from the request
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = parseCookies(cookieHeader)
    
    return NextResponse.json({
      status: "success",
      session,
      roleCookie: cookies.selectedRole,
      allCookies: cookies,
    })
  } catch (error) {
    console.error("Error in cookie debug endpoint:", error)
    return NextResponse.json({
      status: "error",
      message: "An error occurred while retrieving cookie information",
      error: (error as Error).message
    }, { status: 500 })
  }
}

// Helper function to parse cookies
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  
  if (!cookieHeader) return cookies
  
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=')
    if (parts.length >= 2) {
      const key = parts[0].trim()
      const value = parts.slice(1).join('=').trim()
      cookies[key] = value
    }
  })
  
  return cookies
}