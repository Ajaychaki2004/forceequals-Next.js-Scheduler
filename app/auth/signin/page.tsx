"use client"

import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"

export default function SignInPage() {
  const searchParams = useSearchParams()
  const role = searchParams.get("role") || "buyer"
  const error = searchParams.get("error")
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)
    
    const callbackUrl = role === "seller" ? "/seller/dashboard" : "/buyer/appointment"
    
    // After authentication, we'll update the user's role on first page load
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
                  <p className="mb-2">Please try signing in again. The system will automatically link your accounts.</p>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => {
                      window.location.href = "/auth/signin?callbackUrl=/buyer/appointment";
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                "There was an error signing in. Please try again."
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
