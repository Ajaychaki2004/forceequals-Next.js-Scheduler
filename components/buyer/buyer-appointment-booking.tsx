"use client"

import { useState, useEffect } from "react"
import type { Session } from "next-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, Clock, User, Settings } from "lucide-react"
import { SellersList } from "./sellers-list"
import { AvailabilityPicker } from "./availability-picker"
import { BookingForm } from "./booking-form"

interface BuyerAppointmentBookingProps {
  session: Session
}

export function BuyerAppointmentBooking({ session }: BuyerAppointmentBookingProps) {
  const [sellers, setSellers] = useState([])
  const [selectedSeller, setSelectedSeller] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [bookingStep, setBookingStep] = useState<"select-seller" | "select-time" | "confirm-booking">("select-seller")

  useEffect(() => {
    fetchSellers()
  }, [])

  const fetchSellers = async () => {
    try {
      const response = await fetch("/api/sellers")
      if (response.ok) {
        const sellersData = await response.json()
        setSellers(sellersData.filter((seller: any) => seller.isCalendarConnected))
      }
    } catch (error) {
      console.error("Error fetching sellers:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSellers = sellers.filter(
    (seller: any) =>
      seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSellerSelect = (seller: any) => {
    setSelectedSeller(seller)
    setBookingStep("select-time")
  }

  const handleTimeSelect = () => {
    setBookingStep("confirm-booking")
  }

  const handleBookingComplete = () => {
    setBookingStep("select-seller")
    setSelectedSeller(null)
    // Optionally redirect to appointments page
  }

  const resetBooking = () => {
    setBookingStep("select-seller")
    setSelectedSeller(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sellers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Book Appointment</h1>
              <p className="text-muted-foreground">Find and book appointments with available sellers</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {session.user.name}
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Booking Steps Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center gap-2 ${bookingStep === "select-seller" ? "text-primary" : "text-muted-foreground"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${bookingStep === "select-seller" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                1
              </div>
              <span className="font-medium">Select Seller</span>
            </div>
            <div className="w-8 h-px bg-border"></div>
            <div
              className={`flex items-center gap-2 ${bookingStep === "select-time" ? "text-primary" : "text-muted-foreground"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${bookingStep === "select-time" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                2
              </div>
              <span className="font-medium">Select Time</span>
            </div>
            <div className="w-8 h-px bg-border"></div>
            <div
              className={`flex items-center gap-2 ${bookingStep === "confirm-booking" ? "text-primary" : "text-muted-foreground"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${bookingStep === "confirm-booking" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                3
              </div>
              <span className="font-medium">Confirm</span>
            </div>
          </div>
        </div>

        {/* Step 1: Select Seller */}
        {bookingStep === "select-seller" && (
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Find a Seller
                </CardTitle>
                <CardDescription>Search and select a seller to book an appointment with</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search sellers by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <SellersList sellers={filteredSellers} onSellerSelect={handleSellerSelect} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Select Time */}
        {bookingStep === "select-time" && selectedSeller && (
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Select Available Time
                    </CardTitle>
                    <CardDescription>Choose an available time slot with {selectedSeller.name}</CardDescription>
                  </div>
                  <Button variant="outline" onClick={resetBooking}>
                    Change Seller
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <AvailabilityPicker seller={selectedSeller} onTimeSelect={handleTimeSelect} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Confirm Booking */}
        {bookingStep === "confirm-booking" && selectedSeller && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Confirm Appointment
                </CardTitle>
                <CardDescription>Review and confirm your appointment details</CardDescription>
              </CardHeader>
              <CardContent>
                <BookingForm
                  seller={selectedSeller}
                  buyer={session.user}
                  onBookingComplete={handleBookingComplete}
                  onBack={() => setBookingStep("select-time")}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
