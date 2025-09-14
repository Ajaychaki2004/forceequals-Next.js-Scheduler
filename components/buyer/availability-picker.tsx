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
      const startDate = new Date(selectedDate)
      startDate.setHours(0, 0, 0, 0)

      const endDate = new Date(selectedDate)
      endDate.setHours(23, 59, 59, 999)

      const response = await fetch(
        `/api/calendar/availability?sellerEmail=${encodeURIComponent(seller.email)}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      )

      const data = await response.json()
      
      if (response.ok) {
        setAvailableSlots(data.availableSlots || [])
      } else {
        // Handle specific error cases
        if (response.status === 404) {
          setErrorMessage(data.message || "This seller hasn't connected their Google Calendar yet.")
        } else {
          setErrorMessage("Could not retrieve availability information.")
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
          <p className="text-foreground font-medium mb-1">Calendar Not Connected</p>
          <p className="text-muted-foreground">{errorMessage}</p>
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
              }`}
              onClick={() => handleSlotSelect(slot)}
            >
              <CardContent className="p-3 text-center">
                <div className="text-sm font-medium text-foreground">{formatTime(slot.startTime)}</div>
                <div className="text-xs text-muted-foreground">{formatTime(slot.endTime)}</div>
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
