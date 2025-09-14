import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { Session } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { SellerModel } from "@/lib/models/seller"

export async function GET(
  request: NextRequest, 
  context: { params: { id: string } }
) {
  try {
    // Extract ID from context properly according to Next.js App Router pattern
    const { id } = context.params
    console.log(`Fetching seller with ID: ${id}`)

    // @ts-ignore - Type issues with NextAuth session
    const session = await getServerSession(authOptions) as Session | null

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const seller = await SellerModel.findById(id)

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

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params
    console.log(`Updating seller with ID: ${id}`)

    // @ts-ignore - Type issues with NextAuth session
    const session = await getServerSession(authOptions) as Session | null

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

        // Only the seller can delete their own account
    // In the future if admin role is added, we can check for that too
    if (!session || !session.user || session.user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    
    // TODO: Implement update logic with SellerModel when needed
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating seller:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params
    console.log(`Deleting seller with ID: ${id}`)

    // @ts-ignore - Type issues with NextAuth session
    const session = await getServerSession(authOptions) as Session | null

    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // TODO: Implement delete logic with SellerModel when needed
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting seller:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
