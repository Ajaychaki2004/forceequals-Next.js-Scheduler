import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { Session } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { SellerModel } from "@/lib/models/seller"
import { GoogleCalendarService } from "@/lib/google-calendar"

export async function GET() {
  try {
    // @ts-ignore - Type issues with NextAuth session
    const session = await getServerSession(authOptions) as Session | null

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Fetching sellers for user:", session.user?.email)
    const sellers = await SellerModel.findAll()
    console.log(`Found ${sellers.length} sellers`)

    // Process sellers to check calendar connection
    const processedSellers = await Promise.all(
      sellers.map(async (seller) => {
        let isCalendarConnected = false
        
        // Only check connection if they have a refresh token
        if (seller.refreshToken) {
          try {
            isCalendarConnected = await GoogleCalendarService.isCalendarConnected(seller.email)
          } catch (error) {
            console.error(`Error checking calendar connection for ${seller.email}:`, error)
            isCalendarConnected = false
          }
        }
        
        return {
          _id: seller._id,
          name: seller.name,
          email: seller.email,
          isCalendarConnected,
        }
      })
    )
    
    const publicSellers = processedSellers

    return NextResponse.json(publicSellers)
  } catch (error) {
    console.error("Error fetching sellers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // @ts-ignore - Type issues with NextAuth session
    const session = await getServerSession(authOptions) as Session | null

    if (!session || !session.user || session.user.role !== "seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token required" }, { status: 400 })
    }

    await SellerModel.updateRefreshToken(session.user.email!, refreshToken)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating seller:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
