import { getServerSession } from "next-auth/next"
// @ts-ignore - Import with TypeScript ignore
import { authOptions } from "../api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default async function HomePage() {
  // @ts-ignore - TypeScript issue with authOptions
  const session = await getServerSession(authOptions)

  if (session?.user) {
    // Redirect based on user role
    // @ts-ignore - We know our session has a role property
    if (session.user.role === "seller") {
      redirect("/seller/dashboard")
    } else {
      redirect("/buyer/appointment")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Appointment Booking</CardTitle>
          <CardDescription>Connect your Google Calendar and start booking appointments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">Choose your role to get started</p>
            <div className="space-y-3">
              <Link href="/api/auth/signin?role=seller" className="block">
                <Button className="w-full" variant="default">
                  Sign in as Seller
                </Button>
              </Link>
              <Link href="/api/auth/signin?role=buyer" className="block">
                <Button className="w-full bg-transparent" variant="outline">
                  Sign in as Buyer
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}