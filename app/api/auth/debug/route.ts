import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../[...nextauth]/route"
import { ExtendedSession } from "@/types/auth"

const client = new MongoClient(process.env.MONGODB_URI!)
const clientPromise = client.connect()

export async function GET() {
  try {
    // @ts-ignore
    const session = await getServerSession(authOptions) as ExtendedSession | null
    
    if (!session?.user?.email) {
      return new NextResponse(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }
    
    // Get database info for debugging
    const db = (await clientPromise).db()
    
    // Get user info
    const user = await db.collection("users").findOne({ 
      email: session.user.email 
    })
    
    // Get accounts linked to this user
    const accounts = await db.collection("accounts").find({ 
      userId: user?._id.toString() 
    }).toArray()
    
    // Get active sessions for this user
    const sessions = await db.collection("sessions").find({
      userId: user?._id.toString()
    }).toArray()
    
    // Return debugging info
    return new NextResponse(JSON.stringify({
      session,
      user,
      accounts,
      sessions,
      message: "Debug information retrieved successfully"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Debug API error:", error)
    return new NextResponse(JSON.stringify({ error: "Internal server error", details: error }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// Reset function to clear accounts for an email (admin only)
export async function POST(request: Request) {
  try {
    const { email, action } = await request.json()
    
    // Security: This is a debug-only endpoint
    if (process.env.NODE_ENV !== "development") {
      return new NextResponse(JSON.stringify({ error: "Debug functions only available in development" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }
    
    if (!email) {
      return new NextResponse(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }
    
    const db = (await clientPromise).db()
    
    if (action === "reset-accounts") {
      // Find user
      const user = await db.collection("users").findOne({ email })
      
      if (!user) {
        return new NextResponse(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        })
      }
      
      // Delete all accounts linked to this user
      const result = await db.collection("accounts").deleteMany({ 
        userId: user._id.toString() 
      })
      
      return new NextResponse(JSON.stringify({ 
        message: "Accounts reset successfully", 
        deleted: result.deletedCount 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }
    
    return new NextResponse(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Debug API error:", error)
    return new NextResponse(JSON.stringify({ error: "Internal server error", details: error }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}