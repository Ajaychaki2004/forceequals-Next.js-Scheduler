"use client"

import { useState, useEffect } from "react"
import type { Session } from "next-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, Settings, Calendar, CheckCircle } from "lucide-react"
import { CalendarView } from "./calendar-view"
import { ConnectCalendarButton } from "./connect-calendar-button"
import { AppointmentsList } from "./appointments-list"
import { DashboardStats } from "./dashboard-stats"

interface SellerDashboardProps {
  session: Session
}

export function SellerDashboard({ session }: SellerDashboardProps) {
  const [isCalendarConnected, setIsCalendarConnected] = useState(false)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch appointments
      const appointmentsRes = await fetch("/api/appointments")
      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json()
        setAppointments(appointmentsData)
      }

      // Check calendar connection status
      const sellerRes = await fetch(`/api/sellers/${session.user.id}`)
      if (sellerRes.ok) {
        const sellerData = await sellerRes.json()
        setIsCalendarConnected(sellerData.isCalendarConnected)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
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
              <h1 className="text-2xl font-bold text-foreground">Seller Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {session.user.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={isCalendarConnected ? "default" : "secondary"} className="flex items-center gap-2">
                {isCalendarConnected ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Calendar Connected
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    Calendar Disconnected
                  </>
                )}
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
        {/* Calendar Connection Alert */}
        {!isCalendarConnected && (
          <Card className="mb-6 border-accent bg-accent/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-accent" />
                  <div>
                    <h3 className="font-semibold text-foreground">Connect Your Google Calendar</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect your calendar to start receiving appointment bookings
                    </p>
                  </div>
                </div>
                <ConnectCalendarButton onConnect={() => setIsCalendarConnected(true)} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Stats */}
        <DashboardStats appointments={appointments} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Calendar View */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Calendar View
                </CardTitle>
                <CardDescription>View and manage your appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <CalendarView appointments={appointments} isConnected={isCalendarConnected} />
              </CardContent>
            </Card>
          </div>

          {/* Appointments List */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Upcoming Appointments
                </CardTitle>
                <CardDescription>Your next scheduled meetings</CardDescription>
              </CardHeader>
              <CardContent>
                <AppointmentsList
                  appointments={appointments.filter((apt: any) => new Date(apt.startTime) > new Date())}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
