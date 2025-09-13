"use client"

import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"

export default function SignInPage() {
  const searchParams = useSearchParams()
  const urlRole = searchParams.get("role")
  const [isLoading, setIsLoading] = useState(false)
  const error = searchParams.get("error")
  
  // Try to get role from sessionStorage first, then URL, then cookies, then default to "buyer"
  const [role, setRole] = useState(() => {
    // Only access sessionStorage on client side
    if (typeof window !== 'undefined') {
      // Check sessionStorage first
      const savedRole = sessionStorage.getItem('selectedRole')
      if (savedRole && (savedRole === "buyer" || savedRole === "seller")) {
        return savedRole
      }
      
      // Then check URL
      if (urlRole && (urlRole === "buyer" || urlRole === "seller")) {
        return urlRole
      }
      
      // Then check cookies
      const cookies = document.cookie.split(';')
      const roleCookie = cookies.find(cookie => cookie.trim().startsWith('selectedRole='))
      if (roleCookie) {
        const cookieValue = roleCookie.split('=')[1].trim()
        if (cookieValue === "buyer" || cookieValue === "seller") {
          return cookieValue
        }
      }
    }
    return "buyer"
  })
  
  // Update sessionStorage when role changes from URL
  useEffect(() => {
    if (urlRole && (urlRole === "buyer" || urlRole === "seller")) {
      setRole(urlRole)
      sessionStorage.setItem('selectedRole', urlRole)
      
      // Also set a cookie with the role that expires in 1 day
      document.cookie = `selectedRole=${urlRole};path=/;max-age=86400`
    }
  }, [urlRole])

  const handleSignIn = async () => {
    setIsLoading(true)
    
    // Store the selected role in sessionStorage before redirecting
    sessionStorage.setItem('selectedRole', role)
    console.log(`Stored role in sessionStorage: ${role}`)
    
    // Also set a cookie with the role that expires in 1 day
    document.cookie = `selectedRole=${role};path=/;max-age=86400`
    console.log(`Set cookie: selectedRole=${role}`)
    
    // Preserve the role in the callback URL as a query parameter
    const callbackUrl = role === "seller" 
      ? `/seller/dashboard?role=${role}` 
      : `/buyer/appointment?role=${role}`
    
    // Pass the role as a custom parameter to be used in the signIn callback
    await signIn("google", {
      callbackUrl: callbackUrl,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sign in as {role === "seller" ? "Seller" : "Buyer"}</CardTitle>
          <CardDescription>Connect your Google account to access your calendar</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
              {error === "OAuthAccountNotLinked" ? (
                <div>
                  <p className="mb-2">This email is already registered with a different sign-in method.</p>
                  <p className="mb-2">Please try signing in again with the same method you used previously.</p>
                  <div className="flex flex-col space-y-2 mt-3">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => {
                        window.location.href = "/auth/signin?callbackUrl=/buyer/appointment";
                      }}
                    >
                      Try Again
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        window.location.href = "/auth/debug";
                      }}
                    >
                      Debug Authentication
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p>There was an error signing in: {error}</p>
                  <p className="mt-2">Please try again or visit the debug page.</p>
                  <div className="flex space-x-2 mt-3">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => {
                        window.location.href = "/auth/signin";
                      }}
                    >
                      Try Again
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        window.location.href = "/auth/debug";
                      }}
                    >
                      Debug
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          <Button onClick={handleSignIn} disabled={isLoading} className="w-full" size="lg">
            {isLoading ? "Signing in..." : "Continue with Google"}
          </Button>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            By signing in, you agree to connect your Google Calendar for appointment scheduling
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
