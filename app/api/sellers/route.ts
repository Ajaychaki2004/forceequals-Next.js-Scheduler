import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { SellerModel } from "@/lib/models/seller"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sellers = await SellerModel.findAll()

    // Remove sensitive data before sending to client
    const publicSellers = sellers.map((seller) => ({
      _id: seller._id,
      name: seller.name,
      email: seller.email,
      isCalendarConnected: seller.isCalendarConnected,
    }))

    return NextResponse.json(publicSellers)
  } catch (error) {
    console.error("Error fetching sellers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "seller") {
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
