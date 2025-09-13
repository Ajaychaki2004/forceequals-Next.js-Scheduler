import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { GoogleCalendarService } from "@/lib/google-calendar"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sellerEmail = searchParams.get("sellerEmail")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!sellerEmail || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Get busy times from Google Calendar
    const busyTimes = await GoogleCalendarService.getFreeBusyInfo(sellerEmail, startDate, endDate)

    // Generate available slots
    const availableSlots = GoogleCalendarService.generateAvailableSlots(
      busyTimes,
      new Date(startDate),
      new Date(endDate),
    )

    return NextResponse.json({ availableSlots, busyTimes })
  } catch (error) {
    console.error("Error fetching availability:", error)
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 })
  }
}
