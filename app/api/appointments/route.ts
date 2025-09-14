import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { Session } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { AppointmentModel } from "@/lib/models/appointment"

export async function GET(request: NextRequest) {
  try {
    // @ts-ignore - Type issues with NextAuth session
    const session = await getServerSession(authOptions) as Session | null

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`Fetching appointments for ${session.user.role} with ID: ${session.user.id || "unknown"}`)
    console.log("User object:", JSON.stringify(session.user))

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "upcoming"

    let appointments: any[] = []
    const userId = session.user.id || ""

    try {
      // Get database instance for direct check
      const client = await (await import("@/lib/mongodb")).default
      const db = client.db()
      
      // Check if collection exists and count documents
      const collectionNames = (await db.listCollections().toArray()).map(c => c.name)
      const hasCollection = collectionNames.includes("appointments")
      
      console.log(`Database: ${db.databaseName}, Collections: ${collectionNames.join(", ")}`)
      console.log(`Appointments collection exists: ${hasCollection}`)
      
      if (hasCollection) {
        // Check direct count in collection
        const totalCount = await db.collection("appointments").countDocuments({})
        console.log(`Total documents in appointments collection: ${totalCount}`)
        
        // Try raw query to find all appointments for this user
        const directQuery = { 
          $or: [
            { buyerId: userId },
            { sellerId: userId }
          ]
        }
        const directResult = await db.collection("appointments").find(directQuery).toArray()
        console.log(`Direct query found ${directResult.length} appointments for user ${userId}`)
      }
      
      // Continue with our model methods
      if (type === "upcoming") {
        appointments = await AppointmentModel.findUpcoming(userId, session.user.role as any)
      } else if (session.user.role === "buyer") {
        appointments = await AppointmentModel.findByBuyerId(userId)
      } else {
        appointments = await AppointmentModel.findBySellerId(userId)
      }
      
      console.log(`Model query found ${appointments.length} appointments for user`)
    } catch (error) {
      console.error("Error while querying appointments:", error)
    }

    // Ensure appointments is always an array
    const appointmentsArray = Array.isArray(appointments) ? appointments : [];
    
    // Return appointments with diagnostic info
    return NextResponse.json({
      appointments: appointmentsArray,
      diagnostics: {
        userId: session.user.id,
        role: session.user.role,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // @ts-ignore - Type issues with NextAuth session
    const session = await getServerSession(authOptions) as Session | null

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.log(`Creating appointment for user: ${session.user.email} with ID: ${session.user.id || "unknown"}`)

    const body = await request.json()
    const { sellerId, sellerEmail, sellerName, title, description, startTime, endTime, eventId, meetingLink } = body

    // Validate required fields
    if (!sellerId || !title || !startTime || !endTime || !eventId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const appointment = await AppointmentModel.create({
      buyerId: session.user.id || "",
      buyerEmail: session.user.email || "",
      buyerName: session.user.name || "Anonymous User",
      sellerId,
      sellerEmail,
      sellerName,
      eventId,
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: "scheduled",
      meetingLink: meetingLink || undefined,
    })

    return NextResponse.json(appointment)
  } catch (error) {
    console.error("Error creating appointment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
