import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { UserRole } from './types/auth'

// This middleware runs on all requests
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Get the role from the URL
  const { searchParams } = new URL(request.url)
  const roleParam = searchParams.get('role') as UserRole | null
  
  if (roleParam && (roleParam === 'buyer' || roleParam === 'seller')) {
    // Set a cookie with the role so it's accessible on both client and server
    response.cookies.set('selectedRole', roleParam, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })
  }
  
  return response
}

// Apply this middleware to all routes
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}