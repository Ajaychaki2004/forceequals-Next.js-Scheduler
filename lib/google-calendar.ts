import { google } from "googleapis"
import { SellerModel } from "./models/seller"

export class GoogleCalendarService {
  private static getOAuth2Client(refreshToken: string) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL,
    )

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    })

    return oauth2Client
  }

  static async getCalendarClient(sellerEmail: string) {
    const seller = await SellerModel.findByEmail(sellerEmail)
    if (!seller || !seller.refreshToken) {
      throw new Error("Seller not found or calendar not connected")
    }

    const oauth2Client = this.getOAuth2Client(seller.refreshToken)
    return google.calendar({ version: "v3", auth: oauth2Client })
  }

  static async getFreeBusyInfo(sellerEmail: string, timeMin: string, timeMax: string) {
    try {
      const calendar = await this.getCalendarClient(sellerEmail)

      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin,
          timeMax,
          items: [{ id: "primary" }],
        },
      })

      const busyTimes = response.data.calendars?.primary?.busy || []
      return busyTimes
    } catch (error) {
      console.error("Error fetching free/busy info:", error)
      throw new Error("Failed to fetch availability")
    }
  }

  static async createEvent(
    sellerEmail: string,
    buyerEmail: string,
    eventDetails: {
      summary: string
      description?: string
      startTime: string
      endTime: string
      attendees: string[]
    },
  ) {
    try {
      const calendar = await this.getCalendarClient(sellerEmail)

      const event = {
        summary: eventDetails.summary,
        description: eventDetails.description,
        start: {
          dateTime: eventDetails.startTime,
          timeZone: "America/New_York", // You might want to make this configurable
        },
        end: {
          dateTime: eventDetails.endTime,
          timeZone: "America/New_York",
        },
        attendees: eventDetails.attendees.map((email) => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: "hangoutsMeet",
            },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 }, // 24 hours before
            { method: "popup", minutes: 30 }, // 30 minutes before
          ],
        },
      }

      const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
        conferenceDataVersion: 1,
        sendUpdates: "all",
      })

      return {
        eventId: response.data.id,
        meetingLink: response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri,
        event: response.data,
      }
    } catch (error) {
      console.error("Error creating calendar event:", error)
      throw new Error("Failed to create calendar event")
    }
  }

  static async updateEvent(
    sellerEmail: string,
    eventId: string,
    updates: {
      summary?: string
      description?: string
      startTime?: string
      endTime?: string
    },
  ) {
    try {
      const calendar = await this.getCalendarClient(sellerEmail)

      const updateData: any = {}

      if (updates.summary) updateData.summary = updates.summary
      if (updates.description) updateData.description = updates.description
      if (updates.startTime) {
        updateData.start = {
          dateTime: updates.startTime,
          timeZone: "America/New_York",
        }
      }
      if (updates.endTime) {
        updateData.end = {
          dateTime: updates.endTime,
          timeZone: "America/New_York",
        }
      }

      const response = await calendar.events.patch({
        calendarId: "primary",
        eventId,
        requestBody: updateData,
        sendUpdates: "all",
      })

      return response.data
    } catch (error) {
      console.error("Error updating calendar event:", error)
      throw new Error("Failed to update calendar event")
    }
  }

  static async deleteEvent(sellerEmail: string, eventId: string) {
    try {
      const calendar = await this.getCalendarClient(sellerEmail)

      await calendar.events.delete({
        calendarId: "primary",
        eventId,
        sendUpdates: "all",
      })

      return true
    } catch (error) {
      console.error("Error deleting calendar event:", error)
      throw new Error("Failed to delete calendar event")
    }
  }

  static async getUpcomingEvents(sellerEmail: string, maxResults = 10) {
    try {
      const calendar = await this.getCalendarClient(sellerEmail)

      const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: "startTime",
      })

      return response.data.items || []
    } catch (error) {
      console.error("Error fetching upcoming events:", error)
      throw new Error("Failed to fetch upcoming events")
    }
  }

  static generateAvailableSlots(
    busyTimes: Array<{ start: string; end: string }>,
    startDate: Date,
    endDate: Date,
    slotDuration = 60, // minutes
    workingHours: { start: number; end: number } = { start: 9, end: 17 }, // 9 AM to 5 PM
  ) {
    const availableSlots = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      // Skip weekends (optional - you might want to make this configurable)
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        currentDate.setDate(currentDate.getDate() + 1)
        continue
      }

      // Generate slots for the current day
      for (let hour = workingHours.start; hour < workingHours.end; hour++) {
        const slotStart = new Date(currentDate)
        slotStart.setHours(hour, 0, 0, 0)

        const slotEnd = new Date(slotStart)
        slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration)

        // Check if this slot conflicts with any busy time
        const isConflict = busyTimes.some((busyTime) => {
          const busyStart = new Date(busyTime.start)
          const busyEnd = new Date(busyTime.end)

          return (
            (slotStart >= busyStart && slotStart < busyEnd) ||
            (slotEnd > busyStart && slotEnd <= busyEnd) ||
            (slotStart <= busyStart && slotEnd >= busyEnd)
          )
        })

        // Only add slot if it's not in the past and doesn't conflict
        if (!isConflict && slotStart > new Date()) {
          availableSlots.push({
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            available: true,
          })
        }
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return availableSlots
  }
}
