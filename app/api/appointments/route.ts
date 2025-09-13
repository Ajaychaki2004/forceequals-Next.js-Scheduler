import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { AppointmentModel } from "@/lib/models/appointment"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "upcoming"

    let appointments

    if (type === "upcoming") {
      appointments = await AppointmentModel.findUpcoming(session.user.id, session.user.role)
    } else if (session.user.role === "buyer") {
      appointments = await AppointmentModel.findByBuyerId(session.user.id)
    } else {
      appointments = await AppointmentModel.findBySellerId(session.user.id)
    }

    return NextResponse.json(appointments)
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { sellerId, sellerEmail, sellerName, title, description, startTime, endTime, eventId, meetingLink } = body

    // Validate required fields
    if (!sellerId || !title || !startTime || !endTime || !eventId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const appointment = await AppointmentModel.create({
      buyerId: session.user.id,
      buyerEmail: session.user.email!,
      buyerName: session.user.name!,
      sellerId,
      sellerEmail,
      sellerName,
      eventId,
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: "scheduled",
      meetingLink,
    })

    return NextResponse.json(appointment)
  } catch (error) {
    console.error("Error creating appointment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
