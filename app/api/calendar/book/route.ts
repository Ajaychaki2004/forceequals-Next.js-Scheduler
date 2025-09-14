import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { Session } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { GoogleCalendarService } from "@/lib/google-calendar"
import { AppointmentModel } from "@/lib/models/appointment"

export async function POST(request: NextRequest) {
  try {
    // @ts-ignore - Type issues with NextAuth session
    const session = await getServerSession(authOptions) as Session | null

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { sellerEmail, sellerName, sellerId, title, description, startTime, endTime } = body

    // Validate required fields
    if (!sellerEmail || !sellerId || !title || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create calendar event
    const calendarEvent = await GoogleCalendarService.createEvent(sellerEmail, session.user.email!, {
      summary: title,
      description: description || `Appointment with ${session.user.name}`,
      startTime,
      endTime,
      attendees: [session.user.email!, sellerEmail],
    })

    // Log the session user ID to help troubleshoot
    console.log("Creating appointment with buyer ID:", session.user.id || "unknown")
    
    // Create appointment record in database
    const appointment = await AppointmentModel.create({
      buyerId: session.user.id || sellerId.substring(0, 10), // Fallback to avoid empty ID
      buyerEmail: session.user.email || "unknown",
      buyerName: session.user.name || "Unknown User",
      sellerId,
      sellerEmail,
      sellerName,
      eventId: calendarEvent.eventId || "unknown",
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: "scheduled",
      meetingLink: calendarEvent.meetingLink || undefined,
    })

    return NextResponse.json({
      appointment,
      calendarEvent: {
        eventId: calendarEvent.eventId,
        meetingLink: calendarEvent.meetingLink,
      },
    })
  } catch (error) {
    console.error("Error booking appointment:", error)
    return NextResponse.json({ error: "Failed to book appointment" }, { status: 500 })
  }
}
