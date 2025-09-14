import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth/next"
import { Session } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(request: NextRequest) {
  try {
    // @ts-ignore - Type issues with NextAuth session
    const session = await getServerSession(authOptions) as Session | null

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const client = await clientPromise
    const db = client.db()
    
    // Create a test appointment directly in the database
    const testAppointment = {
      buyerId: session.user.id || new ObjectId().toString(),
      buyerEmail: session.user.email || "test@example.com",
      buyerName: session.user.name || "Test User",
      sellerId: new ObjectId().toString(),
      sellerEmail: "seller@example.com",
      sellerName: "Test Seller",
      eventId: `test-event-${Date.now()}`,
      title: "Test Appointment",
      description: "Created via debug API",
      startTime: new Date(Date.now() + 86400000), // tomorrow
      endTime: new Date(Date.now() + 86400000 + 3600000), // tomorrow + 1 hour
      status: "scheduled",
      meetingLink: "https://meet.example.com/test",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    // Insert directly into the appointments collection
    const result = await db.collection("appointments").insertOne(testAppointment)
    
    return NextResponse.json({
      success: true,
      appointmentId: result.insertedId,
      appointment: {
        ...testAppointment,
        _id: result.insertedId
      },
      database: db.databaseName,
      collectionName: "appointments"
    })
  } catch (error) {
    console.error("Error in create test appointment:", error)
    return NextResponse.json({ 
      error: "Failed to create test appointment",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}