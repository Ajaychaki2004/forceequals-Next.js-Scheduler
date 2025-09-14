"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Clock, Calendar } from "lucide-react"

interface AvailabilityPickerProps {
  seller: any
  onTimeSelect: (selectedTime: { date: Date; startTime: Date; endTime: Date }) => void
}

export function AvailabilityPicker({ seller, onTimeSelect }: AvailabilityPickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAvailability()
  }, [selectedDate, seller])

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  const fetchAvailability = async () => {
    setLoading(true)
    setErrorMessage(null)
    
    try {
      // Get the full day
      const startDate = new Date(selectedDate)
      startDate.setHours(0, 0, 0, 0)

      const endDate = new Date(selectedDate)
      endDate.setHours(23, 59, 59, 999)
      
      console.log(`Fetching availability for ${seller.name} (${seller.email}) on ${startDate.toDateString()}`)

      // Fetch with a 3-day window to ensure we get enough slots if this day is fully booked
      const extendedEndDate = new Date(endDate)
      extendedEndDate.setDate(extendedEndDate.getDate() + 2) // Look ahead 2 more days
      
      const response = await fetch(
        `/api/calendar/availability?sellerEmail=${encodeURIComponent(seller.email)}&startDate=${startDate.toISOString()}&endDate=${extendedEndDate.toISOString()}&workdayStart=9&workdayEnd=18&appointmentDuration=30`,
      )

      const data = await response.json()
      console.log('Availability data:', data)
      
      if (response.ok) {
        // Filter slots for the selected date only - but also include test slots if there are no real slots
        const allAvailableSlots = data.availableSlots || [];
        console.log(`Total slots received from API: ${allAvailableSlots.length}`);
        
        // Filter for the selected date
        const slotsForSelectedDate = allAvailableSlots.filter((slot: any) => {
          const slotDate = new Date(slot.startTime);
          return slotDate.toDateString() === selectedDate.toDateString();
        });
        
        console.log(`Found ${slotsForSelectedDate.length} slots for selected date out of ${allAvailableSlots.length} total slots`);
        
        // If we have no slots for selected date but have test slots for other dates, let's also show them
        if (slotsForSelectedDate.length === 0 && allAvailableSlots.some((slot: any) => slot.isTestSlot)) {
          console.log("No slots for selected date but test slots exist - showing some test slots");
          
          // Create slots for the current selected date
          const testSlots: {startTime: string, endTime: string, available: boolean, isTestSlot: boolean}[] = [];
          const hours = [10, 11, 14, 16]; // 10 AM, 11 AM, 2 PM, 4 PM
          
          hours.forEach(hour => {
            const slotStart = new Date(selectedDate);
            slotStart.setHours(hour, 0, 0, 0);
            
            // Skip past slots
            if (slotStart <= new Date()) {
              return;
            }
            
            const slotEnd = new Date(slotStart);
            slotEnd.setMinutes(slotEnd.getMinutes() + 30);
            
            testSlots.push({
              startTime: slotStart.toISOString(),
              endTime: slotEnd.toISOString(),
              available: true,
              isTestSlot: true
            });
          });
          
          console.log(`Created ${testSlots.length} test slots for selected date`);
          setAvailableSlots(testSlots);
        } else {
          setAvailableSlots(slotsForSelectedDate);
        }
        
        // Only set the error message if we actually have no slots to display
        const hasSlots = slotsForSelectedDate.length > 0 || availableSlots.length > 0;
        if (!hasSlots) {
          setErrorMessage("No available times on this day. Please try another day.");
        } else {
          // Clear any error message if we have slots
          setErrorMessage(null);
        }
      } else {
        // Handle specific error cases
        if (response.status === 404) {
          setErrorMessage(data.message || "This seller hasn't connected their Google Calendar yet.")
        } else {
          setErrorMessage(data.error || "Could not retrieve availability information.")
        }
        console.error("Failed to fetch availability:", data.error)
        setAvailableSlots([])
      }
    } catch (error) {
      console.error("Error fetching availability:", error)
      setErrorMessage("An error occurred while fetching availability.")
      setAvailableSlots([])
    } finally {
      setLoading(false)
    }
  }

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate)
    if (direction === "prev") {
      newDate.setDate(selectedDate.getDate() - 1)
    } else {
      newDate.setDate(selectedDate.getDate() + 1)
    }
    setSelectedDate(newDate)
    setSelectedSlot(null)
  }

  const handleSlotSelect = (slot: any) => {
    setSelectedSlot(slot)
  }

  const handleConfirmTime = () => {
    if (selectedSlot) {
      onTimeSelect({
        date: selectedDate,
        startTime: new Date(selectedSlot.startTime),
        endTime: new Date(selectedSlot.endTime),
      })
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isToday = selectedDate.toDateString() === new Date().toDateString()
  const isPast = selectedDate < new Date(new Date().setHours(0, 0, 0, 0))

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{formatDate(selectedDate)}</h3>
          <p className="text-sm text-muted-foreground">
            {isToday ? "Today" : isPast ? "Past date" : "Available times"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Time Slots */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-muted-foreground">Loading availability...</p>
        </div>
      ) : isPast ? (
        <div className="text-center py-8">
          <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Cannot book appointments in the past</p>
        </div>
      ) : errorMessage ? (
        <div className="text-center py-8">
          <Calendar className="h-8 w-8 text-amber-500 mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">Calendar Notice</p>
          <p className="text-muted-foreground">{errorMessage}</p>
          {errorMessage.includes("calendar") && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4" 
              onClick={() => {
                // Create test slots anyway
                const testSlots: {startTime: string, endTime: string, available: boolean, isTestSlot: boolean}[] = [];
                const hours = [10, 11, 14, 16];
                
                hours.forEach(hour => {
                  const slotStart = new Date(selectedDate);
                  slotStart.setHours(hour, 0, 0, 0);
                  
                  if (slotStart <= new Date()) return;
                  
                  const slotEnd = new Date(slotStart);
                  slotEnd.setMinutes(slotEnd.getMinutes() + 30);
                  
                  testSlots.push({
                    startTime: slotStart.toISOString(),
                    endTime: slotEnd.toISOString(),
                    available: true,
                    isTestSlot: true
                  });
                });
                
                setAvailableSlots(testSlots);
                setErrorMessage(null);
              }}
            >
              Show Demo Slots
            </Button>
          )}
        </div>
      ) : availableSlots.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No available time slots for this date</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {availableSlots.map((slot, index) => (
            <Card
              key={index}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedSlot === slot ? "ring-2 ring-primary bg-primary/5" : ""
              } ${slot.isTestSlot ? "border border-dashed border-primary/50" : ""}`}
              onClick={() => handleSlotSelect(slot)}
            >
              <CardContent className="p-3 text-center">
                <div className="text-sm font-medium text-foreground">{formatTime(slot.startTime)}</div>
                <div className="text-xs text-muted-foreground">{formatTime(slot.endTime)}</div>
                {slot.isTestSlot && (
                  <div className="mt-1 text-[10px] text-primary-500 font-medium">Demo Slot</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirm Button */}
      {selectedSlot && (
        <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
          <div>
            <p className="font-medium text-foreground">Selected Time</p>
            <p className="text-sm text-muted-foreground">
              {formatDate(selectedDate)} at {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
            </p>
          </div>
          <Button onClick={handleConfirmTime}>Continue</Button>
        </div>
      )}
    </div>
  )
}
