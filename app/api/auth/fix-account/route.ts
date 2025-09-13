import { MongoClient, ObjectId } from "mongodb"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // This endpoint will attempt to fix account linking issues
    const { email, provider, providerAccountId } = await request.json()
    
    if (!email || !provider || !providerAccountId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }
    
    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI!)
    await client.connect()
    
    const db = client.db()
    
    // Find the user with this email
    const user = await db.collection("users").findOne({ email })
    
    if (!user) {
      await client.close()
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    // Check if an account with this provider and ID already exists
    const existingAccount = await db.collection("accounts").findOne({
      provider,
      providerAccountId
    })
    
    if (existingAccount) {
      // Update the account to link it to this user
      await db.collection("accounts").updateOne(
        { _id: existingAccount._id },
        { $set: { userId: user._id.toString() } }
      )
    } else {
      // Create a new account linked to this user
      await db.collection("accounts").insertOne({
        userId: user._id.toString(),
        type: "oauth",
        provider,
        providerAccountId,
        created_at: new Date(),
        updated_at: new Date()
      })
    }
    
    // Close the connection
    await client.close()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error fixing account:", error)
    return NextResponse.json({ error: "Failed to fix account" }, { status: 500 })
  }
}