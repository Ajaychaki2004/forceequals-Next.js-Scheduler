import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { GoogleCalendarService } from "@/lib/google-calendar"

export async function GET(request: NextRequest) {
  try {
    // @ts-ignore - Ignore type issues with authOptions
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

    console.log(`Checking availability for seller ${sellerEmail} from ${startDate} to ${endDate}`)

    // First check if seller's calendar is properly connected
    const isConnected = await GoogleCalendarService.isCalendarConnected(sellerEmail)
    if (!isConnected) {
      console.log(`Calendar not connected for seller: ${sellerEmail}`)
      return NextResponse.json({
        error: "Calendar not connected",
        message: "This seller hasn't connected their Google Calendar yet or the connection has expired."
      }, { status: 404 })
    }
    
    console.log(`Calendar connection verified for ${sellerEmail}, fetching busy times`)
    
    // Get busy times from Google Calendar
    const busyTimes = await GoogleCalendarService.getFreeBusyInfo(sellerEmail, startDate, endDate)
    console.log(`Got ${busyTimes.length} busy periods for ${sellerEmail}`)

    // Generate available slots
    const availableSlots = GoogleCalendarService.generateAvailableSlots(
      busyTimes,
      new Date(startDate),
      new Date(endDate),
    )
    console.log(`Generated ${availableSlots.length} available slots for ${sellerEmail}`)

    return NextResponse.json({ availableSlots, busyTimes })
  } catch (error) {
    console.error("Error fetching availability:", error)
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes("Seller not found")) {
        return NextResponse.json({ 
          error: "Seller not found",
          message: "The requested seller could not be found."
        }, { status: 404 })
      } 
      
      if (error.message.includes("Calendar not connected")) {
        return NextResponse.json({ 
          error: "Calendar not connected",
          message: "This seller hasn't connected their Google Calendar yet."
        }, { status: 404 })
      }
      
      if (error.message.includes("Failed to fetch")) {
        return NextResponse.json({ 
          error: "Google Calendar error",
          message: "Unable to access Google Calendar API. The calendar connection may have expired."
        }, { status: 502 })
      }
    }
    
    return NextResponse.json({ 
      error: "Failed to fetch availability",
      message: error instanceof Error ? error.message : "An unknown error occurred"
    }, { status: 500 })
  }
}
