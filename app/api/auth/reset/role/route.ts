import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../[...nextauth]/route"
import { MongoClient, ObjectId } from "mongodb"
import { UserRole } from "@/types/auth"

const client = new MongoClient(process.env.MONGODB_URI!)
const clientPromise = client.connect()

export async function POST(request: NextRequest) {
  try {
    // Get the session to check if user is authenticated
    // @ts-ignore - Ignoring TypeScript errors with authOptions
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({
        status: "error",
        message: "Unauthorized"
      }, { status: 401 })
    }
    
    // Get the role from the request body
    const { email } = await request.json() as { email: string }
    
    if (!email) {
      return NextResponse.json({
        status: "error",
        message: "Email is required"
      }, { status: 400 })
    }
    
    // Verify the email matches the current user (for security)
    if (email !== session.user.email) {
      return NextResponse.json({
        status: "error",
        message: "Can only reset your own role"
      }, { status: 403 })
    }
    
    // Connect to MongoDB
    const db = (await clientPromise).db()
    
    // Find the user
    const user = await db.collection("users").findOne({ email })
    
    if (!user) {
      return NextResponse.json({
        status: "error",
        message: "User not found"
      }, { status: 404 })
    }
    
    // Reset the role to "buyer" (default)
    await db.collection("users").updateOne(
      { _id: user._id },
      { 
        $set: { 
          role: "buyer" as UserRole,
          updatedAt: new Date()
        } 
      }
    )
    
    // Create a response that also clears the role cookie
    const response = NextResponse.json({
      status: "success",
      message: `Role reset to buyer for ${email}`
    })
    
    // Clear the role cookie
    response.cookies.set("selectedRole", "", { 
      expires: new Date(0),
      path: "/"
    })
    
    return response
    
  } catch (error) {
    console.error("Error resetting role:", error)
    return NextResponse.json({
      status: "error",
      message: "An error occurred while resetting the role",
      error: (error as Error).message
    }, { status: 500 })
  }
}