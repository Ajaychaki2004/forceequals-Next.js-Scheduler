import { MongoClient } from "mongodb"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "This endpoint is only available in development mode" }, { status: 403 })
    }

    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI!)
    await client.connect()
    
    const db = client.db()
    
    // Clear all authentication collections
    await db.collection("accounts").deleteMany({})
    await db.collection("sessions").deleteMany({})
    // Don't delete users to preserve roles, but you can uncomment if needed
    // await db.collection("users").deleteMany({}) 
    
    // Close the connection
    await client.close()
    
    return NextResponse.json({ success: true, message: "Authentication data reset" })
  } catch (error) {
    console.error("Error resetting auth data:", error)
    return NextResponse.json({ error: "Failed to reset auth data" }, { status: 500 })
  }
}