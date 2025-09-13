// @ts-ignore - Import authOptions from the NextAuth route
import { authOptions } from "../[...nextauth]/route"
import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const client = new MongoClient(process.env.MONGODB_URI!)
const clientPromise = client.connect()

export async function POST(request: Request) {
  // Check if user is authenticated
  // @ts-ignore - Ignore TypeScript errors with authOptions
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user?.email) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    })
  }

  try {
    // Get the role from the request body
    const { role } = await request.json()
    
    if (!role || (role !== "buyer" && role !== "seller")) {
      return new NextResponse(JSON.stringify({ error: "Invalid role" }), {
        status: 400,
      })
    }

    // Update the user's role in the database
    await (await clientPromise)
      .db()
      .collection("users")
      .updateOne(
        { email: session.user.email },
        {
          $set: {
            role,
            updatedAt: new Date(),
          },
        }
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating role:", error)
    return new NextResponse(JSON.stringify({ error: "Failed to update role" }), {
      status: 500,
    })
  }
}