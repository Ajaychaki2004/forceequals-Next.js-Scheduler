import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db()
    
    // Directly query the appointments collection
    const appointments = await db.collection("appointments").find({}).toArray()
    
    return NextResponse.json({
      count: appointments.length,
      appointments: appointments
    })
  } catch (error) {
    console.error("Error in list-all-appointments endpoint:", error)
    return NextResponse.json({ 
      error: "Failed to list appointments",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}