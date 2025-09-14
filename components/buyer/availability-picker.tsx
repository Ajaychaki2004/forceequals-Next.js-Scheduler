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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Store available slots organized by date for quick lookup
  const [slotsByDate, setSlotsByDate] = useState<{[dateKey: string]: any[]}>({})
  // Keep track of all dates with available slots for navigation
  const [availableDates, setAvailableDates] = useState<Date[]>([])
  
  // Fetch availability data when the component loads or seller changes
  useEffect(() => {
    fetchAvailability()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seller])
  
  // Update displayed slots when selected date changes
  useEffect(() => {
    updateSlotsForSelectedDate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  // Fetch availability data from the API
  const fetchAvailability = async () => {
    setLoading(true)
    setErrorMessage(null)
    
    try {
      // Start with today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // End with 14 days later to get a good range
      const twoWeeksLater = new Date(today)
      twoWeeksLater.setDate(twoWeeksLater.getDate() + 14)
      twoWeeksLater.setHours(23, 59, 59, 999)
      
      console.log(`Fetching availability for ${seller.name} (${seller.email}) from ${today.toDateString()} to ${twoWeeksLater.toDateString()}`)
      
      const response = await fetch(
        `/api/calendar/availability?sellerEmail=${encodeURIComponent(seller.email)}&startDate=${today.toISOString()}&endDate=${twoWeeksLater.toISOString()}&workdayStart=9&workdayEnd=18&appointmentDuration=30`,
      )
      
      const data = await response.json()
      console.log('Availability data:', data)
      
      if (response.ok && data.availableSlots?.length > 0) {
        // Organize slots by date
        const slots = data.availableSlots || []
        const dateMap: {[dateKey: string]: any[]} = {}
        const dates: Date[] = []
        
        // Process all slots and organize by date
        slots.forEach((slot: any) => {
          const slotDate = new Date(slot.startTime)
          const dateKey = slotDate.toDateString()
          
          if (!dateMap[dateKey]) {
            dateMap[dateKey] = []
            dates.push(new Date(slotDate))
          }
          
          dateMap[dateKey].push(slot)
        })
        
        // Sort dates chronologically
        dates.sort((a, b) => a.getTime() - b.getTime())
        
        setSlotsByDate(dateMap)
        setAvailableDates(dates)
        
        // If we have dates with slots, select the first available date
        if (dates.length > 0) {
          // Use the first date with available slots or keep the selected date if it has slots
          const currentDateKey = selectedDate.toDateString()
          if (dateMap[currentDateKey]) {
            // Keep current date selection but update the displayed slots
            updateSlotsForDate(selectedDate)
          } else {
            // Switch to the first available date
            setSelectedDate(dates[0])
            updateSlotsForDate(dates[0])
          }
        } else {
          setErrorMessage("No available times found for this seller.")
        }
      } else {
        // Handle cases where no slots are available
        if (response.status === 404) {
          setErrorMessage(data.message || "This seller hasn't connected their Google Calendar yet.")
        } else if (!data.availableSlots || data.availableSlots.length === 0) {
          setErrorMessage("No available appointment times found.")
        } else {
          setErrorMessage("Could not retrieve availability information.")
        }
      }
    } catch (error) {
      console.error("Error fetching availability:", error)
      setErrorMessage("An error occurred while fetching availability.")
    } finally {
      setLoading(false)
    }
  }
  
  // Update the displayed slots for a specific date
  const updateSlotsForDate = (date: Date) => {
    const dateKey = date.toDateString()
    const slotsForDate = slotsByDate[dateKey] || []
    
    setAvailableSlots(slotsForDate)
    
    if (slotsForDate.length === 0) {
      setErrorMessage("No available times on this day. Please try another day.")
    } else {
      setErrorMessage(null)
    }
    
    // Clear any selected slot when changing date
    setSelectedSlot(null)
  }
  
  // Update slots for the currently selected date
  const updateSlotsForSelectedDate = () => {
    updateSlotsForDate(selectedDate)
  }

  // Navigate to a different date
  const navigateDate = (direction: "prev" | "next") => {
    const currentIndex = availableDates.findIndex(
      date => date.toDateString() === selectedDate.toDateString()
    )
    
    if (direction === "prev" && currentIndex > 0) {
      // Navigate to previous available date
      setSelectedDate(availableDates[currentIndex - 1])
    } else if (direction === "next" && currentIndex < availableDates.length - 1) {
      // Navigate to next available date
      setSelectedDate(availableDates[currentIndex + 1])
    } else if (availableDates.length > 0) {
      // If we're at the boundaries or selected date isn't in the list,
      // go to the first or last available date
      const newDate = direction === "prev" ? availableDates[0] : availableDates[availableDates.length - 1]
      setSelectedDate(newDate)
    }
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

  // Check if selected date is today or in the past
  const isToday = selectedDate.toDateString() === new Date().toDateString()
  const isPast = selectedDate < new Date(new Date().setHours(0, 0, 0, 0))
  
  // Check if we can navigate to previous/next dates
  const canGoBack = availableDates.length > 0 && 
    availableDates[0].toDateString() !== selectedDate.toDateString()
  const canGoForward = availableDates.length > 0 && 
    availableDates[availableDates.length - 1].toDateString() !== selectedDate.toDateString()

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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigateDate("prev")}
            disabled={!canGoBack}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigateDate("next")}
            disabled={!canGoForward}
          >
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
                // Create demo slots for the selected date
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