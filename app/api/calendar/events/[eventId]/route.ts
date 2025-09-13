import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { GoogleCalendarService } from "@/lib/google-calendar"
import { AppointmentModel } from "@/lib/models/appointment"

export async function PATCH(request: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, startTime, endTime } = body

    // Find the appointment to get seller email
    const appointment = await AppointmentModel.findByEventId(params.eventId)
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Check if user has permission to update this appointment
    if (appointment.buyerId !== session.user.id && appointment.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update calendar event
    const updatedEvent = await GoogleCalendarService.updateEvent(appointment.sellerEmail, params.eventId, {
      summary: title,
      description,
      startTime,
      endTime,
    })

    // Update appointment in database if time changed
    if (startTime || endTime) {
      const updates: any = {}
      if (startTime) updates.startTime = new Date(startTime)
      if (endTime) updates.endTime = new Date(endTime)
      if (title) updates.title = title
      if (description) updates.description = description

      // Note: You'd need to add an update method to AppointmentModel
      // await AppointmentModel.update(appointment._id, updates)
    }

    return NextResponse.json({ success: true, event: updatedEvent })
  } catch (error) {
    console.error("Error updating calendar event:", error)
    return NextResponse.json({ error: "Failed to update calendar event" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the appointment to get seller email
    const appointment = await AppointmentModel.findByEventId(params.eventId)
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Check if user has permission to delete this appointment
    if (appointment.buyerId !== session.user.id && appointment.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete calendar event
    await GoogleCalendarService.deleteEvent(appointment.sellerEmail, params.eventId)

    // Update appointment status in database
    await AppointmentModel.updateStatus(appointment._id!.toString(), "cancelled")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting calendar event:", error)
    return NextResponse.json({ error: "Failed to delete calendar event" }, { status: 500 })
  }
}
