"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function RoleParamHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const roleFromUrl = searchParams.get('role')
  
  useEffect(() => {
    // If we have a role in the URL, store it in sessionStorage and cookie
    if (roleFromUrl && (roleFromUrl === 'buyer' || roleFromUrl === 'seller')) {
      console.log(`Storing role from URL param: ${roleFromUrl}`)
      sessionStorage.setItem('selectedRole', roleFromUrl)
      document.cookie = `selectedRole=${roleFromUrl};path=/;max-age=86400`
    } 
    // If we don't have a role in the URL, but we have one in sessionStorage or cookie, add it to the URL
    else if (!roleFromUrl && typeof window !== 'undefined') {
      // Try sessionStorage first
      let savedRole = sessionStorage.getItem('selectedRole')
      
      // If not in sessionStorage, try cookies
      if (!savedRole) {
        const cookies = document.cookie.split(';')
        const roleCookie = cookies.find(cookie => cookie.trim().startsWith('selectedRole='))
        if (roleCookie) {
          savedRole = roleCookie.split('=')[1].trim()
          // Sync with sessionStorage
          if (savedRole && (savedRole === 'buyer' || savedRole === 'seller')) {
            sessionStorage.setItem('selectedRole', savedRole)
          }
        }
      }
      
      // Add role to URL if found in either storage
      if (savedRole && (savedRole === 'buyer' || savedRole === 'seller')) {
        console.log(`Adding role from storage to URL: ${savedRole}`)
        
        // Get current URL
        const url = new URL(window.location.href)
        
        // Add role parameter
        url.searchParams.set('role', savedRole)
        
        // Replace current URL with the new one, keeping the same pathname
        router.replace(url.pathname + url.search)
      }
    }
  }, [roleFromUrl, router])
  
  // This component doesn't render anything
  return null
}