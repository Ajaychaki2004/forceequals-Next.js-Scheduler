import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { Session } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { MongoClient } from "mongodb"

const client = new MongoClient(process.env.MONGODB_URI!)
const clientPromise = client.connect()

export async function GET() {
  try {
    // @ts-ignore - Type issues with NextAuth session
    const session = await getServerSession(authOptions) as Session | null

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Fetching users with seller role")
    const db = (await clientPromise).db()
    const userSellers = await db.collection("users").find({ role: "seller" }).toArray()
    console.log(`Found ${userSellers.length} users with seller role`)

    // Only return public data
    const publicSellers = userSellers.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isCalendarConnected: !!user.refreshToken,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }))

    return NextResponse.json(publicSellers)
  } catch (error) {
    console.error("Error fetching users with seller role:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}