import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { SellerModel } from "@/lib/models/seller"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const seller = await SellerModel.findById(params.id)

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 })
    }

    // Remove sensitive data
    const publicSeller = {
      _id: seller._id,
      name: seller.name,
      email: seller.email,
      isCalendarConnected: seller.isCalendarConnected,
    }

    return NextResponse.json(publicSeller)
  } catch (error) {
    console.error("Error fetching seller:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
