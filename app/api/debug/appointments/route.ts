import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db()
    
    // Direct collection access for diagnostics
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map(c => c.name)
    
    console.log("Available collections:", collectionNames)
    
    // Check if appointments collection exists
    const hasAppointmentsCollection = collectionNames.includes("appointments")
    
    // Try to get all appointments directly
    let allAppointments = []
    let appointmentsError = null
    
    try {
      if (hasAppointmentsCollection) {
        allAppointments = await db.collection("appointments").find({}).toArray()
      }
    } catch (error) {
      console.error("Error fetching appointments:", error)
      appointmentsError = error instanceof Error ? error.message : "Unknown error"
    }
    
    // Get database name
    const dbName = db.databaseName
    
    return NextResponse.json({
      database: dbName,
      collections: collectionNames,
      hasAppointmentsCollection,
      appointmentsCount: allAppointments.length,
      appointments: allAppointments,
      error: appointmentsError
    })
  } catch (error) {
    console.error("Error in debug endpoint:", error)
    return NextResponse.json({ 
      error: "Failed to debug appointments",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}