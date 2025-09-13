"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ExtendedSession } from "@/types/auth"

export default function AuthDebugPage() {
  const { data: session, update } = useSession() as {
    data: ExtendedSession | null;
    update: () => Promise<ExtendedSession | null>;
  }
  const [debugData, setDebugData] = useState<any>(null)
  const [sessionStorageRole, setSessionStorageRole] = useState<string | null>(null)
  const [cookies, setCookies] = useState<string[]>([])
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  
  // Check sessionStorage and cookies when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = sessionStorage.getItem('selectedRole')
      setSessionStorageRole(role)
      
      // Get all cookies
      const allCookies = document.cookie.split(';').map(cookie => cookie.trim())
      setCookies(allCookies)
    }
  }, [])

  const fetchDebugInfo = async () => {
    setLoading(true)
    try {
      const [userResponse, cookieResponse] = await Promise.all([
        fetch("/api/auth/debug"),
        fetch("/api/auth/cookie-debug")
      ])
      
      const userData = await userResponse.json()
      const cookieData = await cookieResponse.json()
      
      setDebugData({
        ...userData,
        cookieDebug: cookieData
      })
    } catch (error) {
      console.error("Error fetching debug info:", error)
      alert("Error fetching debug info")
    } finally {
      setLoading(false)
    }
  }

  const resetAccounts = async () => {
    if (!email) {
      alert("Please enter an email address")
      return
    }
    
    if (!confirm(`Are you sure you want to reset accounts for ${email}?`)) {
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch("/api/auth/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "reset-accounts" }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert(`Success: ${data.message}`)
        // Refetch debug info
        fetchDebugInfo()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Error resetting accounts:", error)
      alert("Error resetting accounts")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Authentication Debugging</CardTitle>
          <CardDescription>Troubleshoot authentication issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Current Session</h3>
              <pre className="bg-muted p-4 rounded-md overflow-auto max-h-60 text-xs mt-2">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-medium">Session Storage Role</h3>
              <pre className="bg-muted p-4 rounded-md overflow-auto max-h-60 text-xs mt-2">
                {sessionStorageRole || "No role found in session storage"}
              </pre>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Cookies</h3>
              <pre className="bg-muted p-4 rounded-md overflow-auto max-h-60 text-xs mt-2">
                {cookies.length > 0 ? cookies.join('\n') : "No cookies found"}
              </pre>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <Button onClick={fetchDebugInfo} disabled={loading}>
                {loading ? "Loading..." : "Fetch Debug Info"}
              </Button>
              <Button onClick={() => update()}>
                Update Session
              </Button>
              <Button variant="destructive" onClick={() => signOut()}>
                Sign Out
              </Button>
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Set Role</h3>
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    // Set role in sessionStorage
                    sessionStorage.setItem('selectedRole', 'buyer')
                    setSessionStorageRole('buyer')
                    
                    // Set role in cookie
                    document.cookie = `selectedRole=buyer;path=/;max-age=86400`
                    
                    // Update cookies list
                    const allCookies = document.cookie.split(';').map(cookie => cookie.trim())
                    setCookies(allCookies)
                    
                    // Update in database
                    try {
                      await fetch('/api/auth/update-role', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ role: 'buyer' }),
                      })
                      
                      await update()
                    } catch (error) {
                      console.error("Error setting buyer role:", error)
                    }
                  }}
                >
                  Set as Buyer
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    // Set role in sessionStorage
                    sessionStorage.setItem('selectedRole', 'seller')
                    setSessionStorageRole('seller')
                    
                    // Set role in cookie
                    document.cookie = `selectedRole=seller;path=/;max-age=86400`
                    
                    // Update cookies list
                    const allCookies = document.cookie.split(';').map(cookie => cookie.trim())
                    setCookies(allCookies)
                    
                    // Update in database
                    try {
                      await fetch('/api/auth/update-role', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ role: 'seller' }),
                      })
                      
                      await update()
                    } catch (error) {
                      console.error("Error setting seller role:", error)
                    }
                  }}
                >
                  Set as Seller
                </Button>
                
                <Button 
                  variant="destructive" 
                  onClick={async () => {
                    if (!session?.user?.email) {
                      alert("You must be signed in to reset your role");
                      return;
                    }
                    
                    if (!confirm("Are you sure you want to reset your role to buyer?")) {
                      return;
                    }
                    
                    try {
                      // Clear sessionStorage
                      sessionStorage.removeItem('selectedRole');
                      setSessionStorageRole(null);
                      
                      // Clear cookie
                      document.cookie = "selectedRole=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                      
                      // Update cookies list
                      const allCookies = document.cookie.split(';').map(cookie => cookie.trim());
                      setCookies(allCookies);
                      
                      // Call API to reset role in database
                      await fetch('/api/auth/reset/role', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: session.user.email }),
                      });
                      
                      // Update session
                      await update();
                      alert("Role has been reset to buyer");
                    } catch (error) {
                      console.error("Error resetting role:", error);
                      alert("Failed to reset role");
                    }
                  }}
                >
                  Reset All Role Data
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {debugData && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">User</h3>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-60 text-xs mt-2">
                  {JSON.stringify(debugData.user, null, 2)}
                </pre>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Linked Accounts</h3>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-60 text-xs mt-2">
                  {JSON.stringify(debugData.accounts, null, 2)}
                </pre>
              </div>

              {debugData.sessions && (
                <div>
                  <h3 className="text-lg font-medium">Active Sessions</h3>
                  <pre className="bg-muted p-4 rounded-md overflow-auto max-h-60 text-xs mt-2">
                    {JSON.stringify(debugData.sessions, null, 2)}
                  </pre>
                </div>
              )}
              
              {debugData.cookieDebug && (
                <div>
                  <h3 className="text-lg font-medium">Server-side Cookie Information</h3>
                  <pre className="bg-muted p-4 rounded-md overflow-auto max-h-60 text-xs mt-2">
                    {JSON.stringify(debugData.cookieDebug, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
          <CardDescription>Use with caution!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">User Email</Label>
              <Input 
                id="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-4">
          <Button onClick={resetAccounts} variant="destructive" disabled={loading}>
            {loading ? "Processing..." : "Reset User Accounts"}
          </Button>
          
          <Button 
            variant="destructive" 
            disabled={loading}
            onClick={async () => {
              if (!confirm("Are you sure you want to reset ALL auth data? This will clear sessions and accounts.")) {
                return
              }
              
              setLoading(true)
              try {
                const response = await fetch("/api/debug/reset", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" }
                })
                
                const data = await response.json()
                
                if (response.ok) {
                  alert("Auth data has been reset")
                  // Sign out the user
                  await signOut({ redirect: false })
                  // Redirect to sign in page
                  window.location.href = "/auth/signin"
                } else {
                  alert(`Error: ${data.error || "Failed to reset auth data"}`)
                }
              } catch (error) {
                console.error("Error resetting auth data:", error)
                alert("Failed to reset auth data")
              } finally {
                setLoading(false)
              }
            }}
          >
            Reset All Auth Data
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}