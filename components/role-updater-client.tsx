"use client"

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ExtendedSession, UserRole } from '@/types/auth'

export function RoleUpdater() {
  const { data: session, update } = useSession() as { 
    data: ExtendedSession | null, 
    update: () => Promise<ExtendedSession | null> 
  }
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Get role from URL param, sessionStorage, or cookies
  const getRoleFromParams = (): UserRole | null => {
    const urlRole = searchParams.get('role') as UserRole | null
    
    // If we have a role in URL, use that
    if (urlRole && (urlRole === 'buyer' || urlRole === 'seller')) {
      return urlRole
    }
    
    // Otherwise check client-side storage
    if (typeof window !== 'undefined') {
      // Check sessionStorage
      const savedRole = sessionStorage.getItem('selectedRole') as UserRole | null
      if (savedRole && (savedRole === 'buyer' || savedRole === 'seller')) {
        return savedRole
      }
      
      // Check cookies as a fallback
      const cookies = document.cookie.split(';')
      const roleCookie = cookies.find(cookie => cookie.trim().startsWith('selectedRole='))
      if (roleCookie) {
        const cookieValue = roleCookie.split('=')[1].trim() as UserRole | null
        if (cookieValue === 'buyer' || cookieValue === 'seller') {
          console.log(`Found role in cookie: ${cookieValue}`)
          // Sync with sessionStorage
          sessionStorage.setItem('selectedRole', cookieValue)
          return cookieValue
        }
      }
    }
    
    return null
  }
  
  const roleParam = getRoleFromParams()

  useEffect(() => {
    // Only run if we have a session, a role parameter, and they're different
    if (session?.user && roleParam && (roleParam === 'buyer' || roleParam === 'seller') && 
        session.user.role !== roleParam) {
      
      const updateUserRole = async () => {
        try {
          console.log(`Updating role to ${roleParam} via client component`)
          // Call our API to update the role
          const response = await fetch('/api/auth/update-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: roleParam }),
          })

          if (response.ok) {
            // Update the session client-side
            await update()
            
            // Remove the role parameter from the URL
            const newUrl = window.location.pathname
            router.replace(newUrl)
          }
        } catch (error) {
          console.error('Failed to update role:', error)
        }
      }

      updateUserRole()
    }
  }, [session, roleParam, update, router])

  return null // This component doesn't render anything
}