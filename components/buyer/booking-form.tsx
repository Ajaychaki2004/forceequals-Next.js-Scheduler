"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { User, Calendar, Clock, ArrowLeft, Loader2 } from "lucide-react"

interface BookingFormProps {
  seller: any
  buyer: any
  selectedTime?: { date: Date; startTime: Date; endTime: Date }
  onBookingComplete: () => void
  onBack: () => void
}

export function BookingForm({ seller, buyer, selectedTime, onBookingComplete, onBack }: BookingFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const appointmentData = {
        sellerId: seller._id,
        sellerEmail: seller.email,
        sellerName: seller.name,
        title: formData.title || "Appointment",
        description: formData.description,
        startTime: selectedTime?.startTime?.toISOString() || new Date().toISOString(),
        endTime: selectedTime?.endTime?.toISOString() || new Date().toISOString(),
      }

      const response = await fetch("/api/calendar/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("Appointment booked successfully:", result)
        onBookingComplete()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to create appointment")
      }
    } catch (error) {
      console.error("Error creating appointment:", error)
      alert(`Failed to book appointment: ${error instanceof Error ? error.message : "Please try again."}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground mb-3">Appointment Summary</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">With:</span>
              <span className="font-medium text-foreground">{seller.name}</span>
            </div>
            {selectedTime && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium text-foreground">
                    {selectedTime.date.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-medium text-foreground">
                    {selectedTime.startTime.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {selectedTime.endTime.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Booking Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Appointment Title</Label>
          <Input
            id="title"
            placeholder="e.g., Consultation, Meeting, etc."
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Add any additional details or agenda items..."
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex items-center justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Booking...
              </>
            ) : (
              "Confirm Booking"
            )}
          </Button>
        </div>
      </form>

      {/* Additional Info */}
      <Card className="border-accent bg-accent/5">
        <CardContent className="p-4">
          <h4 className="font-medium text-foreground mb-2">What happens next?</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• A calendar event will be created for both you and the seller</li>
            <li>• You'll receive a Google Meet link for the appointment</li>
            <li>• Both parties will get email notifications</li>
            <li>• You can manage this appointment from your appointments page</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
