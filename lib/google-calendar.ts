import { google } from "googleapis"
import { SellerModel } from "./models/seller"

export class GoogleCalendarService {
  private oauth2Client: any;
  private calendarClient: any;
  
  // Constructor for instance-based usage with a direct refresh token
  constructor(refreshToken: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL,
    )
    
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    })
    
    this.calendarClient = google.calendar({ version: "v3", auth: this.oauth2Client })
  }
  
  // List calendars to verify connection works
  async listCalendars() {
    try {
      const response = await this.calendarClient.calendarList.list();
      return response.data.items || [];
    } catch (error) {
      console.error("Error listing calendars:", error);
      throw new Error("Failed to list calendars");
    }
  }
  
  // Static methods for backward compatibility
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
    console.log(`Getting calendar client for seller: ${sellerEmail}`)
    const seller = await SellerModel.findByEmail(sellerEmail)
    
    if (!seller) {
      console.error(`Seller not found: ${sellerEmail}`)
      throw new Error("Seller not found")
    }
    
    if (!seller.refreshToken || seller.refreshToken.trim() === '') {
      console.error(`Seller found but has no refresh token: ${sellerEmail}`)
      throw new Error("Calendar not connected - missing refresh token")
    }

    console.log(`Creating calendar client for ${sellerEmail} with refresh token`)
    const oauth2Client = this.getOAuth2Client(seller.refreshToken)
    return google.calendar({ version: "v3", auth: oauth2Client })
  }

  static async getFreeBusyInfo(sellerEmail: string, timeMin: string, timeMax: string): Promise<{start: string; end: string}[]> {
    try {
      console.log(`Getting busy times for ${sellerEmail} from ${timeMin} to ${timeMax}`)
      const calendar = await this.getCalendarClient(sellerEmail)

      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin,
          timeMax,
          items: [{ id: "primary" }],
        },
      })

      // Transform the Google Calendar API response to ensure we have valid start and end strings
      const busyPeriods = response.data.calendars?.primary?.busy || []
      console.log(`Found ${busyPeriods.length} busy periods in Google Calendar for ${sellerEmail}`)
      
      if (busyPeriods.length > 0) {
        console.log('First busy period:', busyPeriods[0])
      }
      
      const busyTimes = busyPeriods.map(period => ({
        start: period.start || timeMin,
        end: period.end || timeMax
      }))
      
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

  // Verify if a seller's calendar is properly connected
  static async isCalendarConnected(sellerEmail: string): Promise<boolean> {
    try {
      console.log(`Checking calendar connection for ${sellerEmail}`)
      const seller = await SellerModel.findByEmail(sellerEmail)
      
      if (!seller) {
        console.log(`No seller found with email: ${sellerEmail}`)
        return false
      }
      
      if (!seller.refreshToken) {
        console.log(`Seller found but has no refresh token: ${sellerEmail}`)
        return false
      }
      
      console.log(`Seller ${sellerEmail} has a refresh token, verifying with Google API`)
      
      // Try to make a simple API call to verify the connection works
      try {
        const oauth2Client = this.getOAuth2Client(seller.refreshToken)
        const calendar = google.calendar({ version: "v3", auth: oauth2Client })
        
        // Just get the calendar list with minimal fields
        const response = await calendar.calendarList.list({
          maxResults: 1,
          fields: "items(id)"
        })
        
        const hasCalendars = Array.isArray(response?.data?.items) && response.data.items.length > 0
        console.log(`Calendar connection verified for ${sellerEmail}: ${hasCalendars ? 'has calendars' : 'no calendars found but connection works'}`)
        return true
      } catch (apiError) {
        console.error(`Google API error for ${sellerEmail}:`, apiError)
        return false
      }
    } catch (error) {
      console.error(`Error verifying calendar connection for ${sellerEmail}:`, error)
      return false
    }
  }

  static generateAvailableSlots(
    busyTimes: { start: string; end: string }[],
    startDate: Date,
    endDate: Date,
    appointmentDuration: number = 30,
    workdayStart: number = 9,
    workdayEnd: number = 17,
  ) {
    console.log(`Generating available slots from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    console.log(`Using workday hours: ${workdayStart}:00 - ${workdayEnd}:00`);
    console.log(`Appointment duration: ${appointmentDuration} minutes`);
    console.log(`Number of busy periods: ${busyTimes.length}`);
    
    if (busyTimes.length > 0) {
      console.log("Busy periods:", busyTimes);
    }
    
    const availableSlots = []
    
    // Create a new date object to avoid mutating the input
    // Make a copy of startDate to use for iteration
    const currentDate = new Date(startDate);
    
    // Log the original dates
    console.log(`Start date: ${startDate.toDateString()} ${startDate.toTimeString()}`);
    console.log(`End date: ${endDate.toDateString()} ${endDate.toTimeString()}`);
    console.log(`Current date for iteration: ${currentDate.toDateString()} ${currentDate.toTimeString()}`);

    // Set current date to midnight for cleaner day calculations
    currentDate.setHours(0, 0, 0, 0);
    
    // Get today's date for comparison
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Count how many days we're processing
    let daysProcessed = 0;
    
    // Make sure we have a valid date range
    if (endDate < startDate) {
      console.log("Warning: End date is before start date. Swapping dates.");
      [startDate, endDate] = [endDate, startDate];
    }
    
    // Generate slots for each day in the range
    while (currentDate <= endDate) {
      daysProcessed++;
      const dayOfWeek = currentDate.getDay();
      const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek];
      
      console.log(`Processing ${dayName} ${currentDate.toDateString()}`);
      
      // Skip weekends (optional - you might want to make this configurable)
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        console.log(`Skipping weekend day: ${dayName}`);
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Skip past days
      if (currentDate < today) {
        console.log(`Skipping past day: ${currentDate.toDateString()}`);
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Generate slots for the current day
      const slotsForDay = [];
      
      // Process each hour in the workday
      for (let hour = workdayStart; hour < workdayEnd; hour++) {
        // Generate slots at specified intervals
        for (let minute = 0; minute < 60; minute += appointmentDuration) {
          // Create slot start time
          const slotStart = new Date(currentDate);
          slotStart.setHours(hour, minute, 0, 0);
          
          // Skip slots in the past (already happened today)
          if (slotStart <= now) {
            continue;
          }

          // Create slot end time
          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + appointmentDuration);

          // Check if this slot conflicts with any busy time
          const conflictingBusyTime = busyTimes.find((busyTime) => {
            const busyStart = new Date(busyTime.start);
            const busyEnd = new Date(busyTime.end);

            return (
              (slotStart >= busyStart && slotStart < busyEnd) ||
              (slotEnd > busyStart && slotEnd <= busyEnd) ||
              (slotStart <= busyStart && slotEnd >= busyEnd)
            );
          });

          // Only add slot if it doesn't conflict with busy time
          if (!conflictingBusyTime) {
            slotsForDay.push({
              startTime: slotStart.toISOString(),
              endTime: slotEnd.toISOString(),
              available: true,
            });
          }
        }
      }
      
      console.log(`Generated ${slotsForDay.length} available slots for ${dayName}`);
      availableSlots.push(...slotsForDay);
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log(`Total days processed: ${daysProcessed}`);
    console.log(`Total available slots generated: ${availableSlots.length}`);
    
      // If no slots were generated, create some dummy slots for testing
    if (availableSlots.length === 0) {
      console.log("No slots were generated. Creating test slots within the requested date range.");
      
      // If we're looking at a past date, don't create dummy slots
      if (startDate < today) {
        console.log("Start date is in the past. Not creating dummy slots.");
        return [];
      }
      
      // Create test slots for each day in the range
      const testDate = new Date(startDate);
      
      while (testDate <= endDate) {
        // Skip weekends and past days
        if (testDate.getDay() !== 0 && testDate.getDay() !== 6 && testDate >= today) {
          console.log(`Creating test slots for ${testDate.toDateString()}`);
          
          // Add test slots at 10 AM, 11 AM, 2 PM, and 4 PM
          [10, 11, 14, 16].forEach(hour => {
            const testSlotStart = new Date(testDate);
            testSlotStart.setHours(hour, 0, 0, 0);
            
            // Skip slots in the past
            if (testSlotStart <= now) {
              return;
            }
            
            const testSlotEnd = new Date(testSlotStart);
            testSlotEnd.setMinutes(testSlotEnd.getMinutes() + 30);
            
            availableSlots.push({
              startTime: testSlotStart.toISOString(),
              endTime: testSlotEnd.toISOString(),
              available: true,
              isTestSlot: true, // Flag to indicate this is a test slot
              isDemoAppointment: true // Additional flag for frontend
            });
          });
        }
        
        // Move to next day
        testDate.setDate(testDate.getDate() + 1);
      }      console.log(`Added ${availableSlots.length} test slots`);
    }
    
    return availableSlots;
  }
}
