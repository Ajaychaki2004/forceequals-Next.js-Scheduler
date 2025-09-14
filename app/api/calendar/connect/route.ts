import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { Session } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { MongoClient } from "mongodb"
import { GoogleCalendarService } from "@/lib/google-calendar"

const client = new MongoClient(process.env.MONGODB_URI!)
const clientPromise = client.connect()

/**
 * Endpoint for sellers to connect their Google Calendar
 * Updates the user record with the provided refreshToken to enable calendar integration
 */
export async function POST(request: Request) {
  try {
    // @ts-ignore - Type issues with NextAuth session
    const session = await getServerSession(authOptions) as Session | null

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Ensure the user has a seller role
    if (session.user.role !== "seller") {
      return NextResponse.json({ error: "Only sellers can connect calendars" }, { status: 403 })
    }

    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token is required" }, { status: 400 })
    }

    // Verify that the refresh token works by testing Google Calendar connection
    try {
      const googleCalendar = new GoogleCalendarService(refreshToken)
      await googleCalendar.listCalendars() // Test that we can access calendars
      
      // Update the user record with the refresh token if verification was successful
      const db = (await clientPromise).db()
      
      await db.collection("users").updateOne(
        { email: session.user.email },
        {
          $set: {
            refreshToken,
            isCalendarConnected: true,
            updatedAt: new Date()
          }
        }
      )
    } catch (calendarError) {
      console.error("Error connecting to Google Calendar:", calendarError)
      return NextResponse.json({ 
        error: "Invalid refresh token or Google Calendar API error",
        details: calendarError instanceof Error ? calendarError.message : "Unknown error"
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Calendar connected successfully"
    })
  } catch (error) {
    console.error("Error connecting calendar:", error)
    return NextResponse.json({ error: "Failed to connect calendar" }, { status: 500 })
  }
}