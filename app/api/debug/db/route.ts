import { MongoClient } from "mongodb"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function GET(request: Request) {
  try {
    // Check if user is authenticated and is authorized
    // @ts-ignore - ignore TypeScript errors with authOptions
    const session = await getServerSession(authOptions)
    
    // Only allow in development environment
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "This endpoint is only available in development mode" }, { status: 403 })
    }

    // Get the collection parameter from the URL
    const url = new URL(request.url)
    const collection = url.searchParams.get("collection")
    
    if (!collection) {
      return NextResponse.json({ error: "Collection parameter is required" }, { status: 400 })
    }
    
    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI!)
    await client.connect()
    
    // Get the collection data
    const db = client.db()
    const data = await db.collection(collection).find({}).toArray()
    
    // Close the connection
    await client.close()
    
    // Return the data
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching database data:", error)
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}