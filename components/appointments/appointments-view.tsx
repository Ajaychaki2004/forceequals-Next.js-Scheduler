"use client"

import { useState, useEffect } from "react"
import type { Session } from "next-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Settings, Filter, Plus } from "lucide-react"
import { AppointmentCard } from "./appointment-card"
import { AppointmentFilters } from "./appointment-filters"
import Link from "next/link"

interface AppointmentsViewProps {
  session: Session
}

export function AppointmentsView({ session }: AppointmentsViewProps) {
  const [appointments, setAppointments] = useState<any[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("upcoming")
  const [apiResponse, setApiResponse] = useState<any>(null) // Store the complete API response
  const [filters, setFilters] = useState({
    status: "all",
    dateRange: "all",
    search: "",
  })

  useEffect(() => {
    fetchAppointments()
  }, [])

  useEffect(() => {
    try {
      applyFilters()
    } catch (error) {
      console.error("Error applying filters:", error)
      setFilteredAppointments([]) // Set to empty array on error
    }
  }, [appointments, filters, activeTab])

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/debug/appointments")
      if (response.ok) {
        const data = await response.json()
        console.log("Appointments API response:", data)
        setApiResponse(data)
        
        // ALWAYS store complete raw API response for debugging
        console.log("Raw API response stored:", data)
        
        // Handle both array response and object response with appointments array
        if (Array.isArray(data)) {
          console.log("Data is an array with length:", data.length)
          setAppointments(data)
        } else if (data && Array.isArray(data.appointments)) {
          console.log("Data contains appointments array with length:", data.appointments.length)
          setAppointments(data.appointments)
          
          // Log diagnostic information if available
          if (data.diagnostics) {
            console.log("Appointments API diagnostics:", data.diagnostics)
          }
        } else {
          console.error("Unexpected response format - setting empty array:", data)
          setAppointments([])
        }
      } else {
        console.error("Error fetching appointments:", response.status)
        setAppointments([])
      }
    } catch (error) {
      console.error("Error fetching appointments:", error)
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    // Ensure we're working with an array
    if (!Array.isArray(appointments)) {
      console.error("Appointments is not an array:", appointments)
      setFilteredAppointments([])
      return
    }
    
    let filtered = [...appointments]
    const now = new Date()

    // Filter by tab (upcoming/past)
    if (activeTab === "upcoming") {
      filtered = filtered.filter((apt: any) => new Date(apt.startTime) >= now)
    } else {
      filtered = filtered.filter((apt: any) => new Date(apt.startTime) < now)
    }

    // Filter by status
    if (filters.status !== "all") {
      filtered = filtered.filter((apt: any) => apt.status === filters.status)
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        (apt: any) =>
          apt.title.toLowerCase().includes(searchLower) ||
          apt.buyerName.toLowerCase().includes(searchLower) ||
          apt.sellerName.toLowerCase().includes(searchLower),
      )
    }

    // Filter by date range
    if (filters.dateRange !== "all") {
      const today = new Date()
      let startDate = new Date()

      switch (filters.dateRange) {
        case "today":
          startDate = new Date(today.setHours(0, 0, 0, 0))
          break
        case "week":
          startDate = new Date(today.setDate(today.getDate() - today.getDay()))
          break
        case "month":
          startDate = new Date(today.getFullYear(), today.getMonth(), 1)
          break
      }

      filtered = filtered.filter((apt: any) => new Date(apt.startTime) >= startDate)
    }

    // Sort by start time
    filtered.sort((a: any, b: any) => {
      const dateA = new Date(a.startTime)
      const dateB = new Date(b.startTime)
      return activeTab === "upcoming" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
    })

    setFilteredAppointments(filtered)
  }

  const handleAppointmentUpdate = (appointmentId: string, updates: any) => {
    setAppointments((prev) => prev.map((apt: any) => (apt._id === appointmentId ? { ...apt, ...updates } : apt)))
  }

  const getAppointmentStats = () => {
    // Ensure appointments is an array
    if (!Array.isArray(appointments)) {
      return { upcoming: 0, past: 0, completed: 0, cancelled: 0 }
    }
    
    try {
      const now = new Date()
      const upcoming = appointments.filter((apt: any) => new Date(apt.startTime) >= now)
      const past = appointments.filter((apt: any) => new Date(apt.startTime) < now)
      const completed = appointments.filter((apt: any) => apt.status === "completed")
      const cancelled = appointments.filter((apt: any) => apt.status === "cancelled")

      return { 
        upcoming: upcoming.length, 
        past: past.length, 
        completed: completed.length, 
        cancelled: cancelled.length 
      }
    } catch (error) {
      console.error("Error calculating appointment stats:", error)
      return { upcoming: 0, past: 0, completed: 0, cancelled: 0 }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading appointments...</p>
        </div>
      </div>
    )
  }

  const stats = getAppointmentStats()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Appointments</h1>
              <p className="text-muted-foreground">View and manage your scheduled appointments</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {session.user.role === "buyer" ? "Buyer" : "Seller"}
              </Badge>
              {session.user.role === "buyer" && (
                <Link href="/buyer/appointment">
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Book Appointment
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                  <p className="text-2xl font-bold text-foreground">{stats.upcoming}</p>
                </div>
                <Clock className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Past</p>
                  <p className="text-2xl font-bold text-foreground">{stats.past}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-green-500"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cancelled</p>
                  <p className="text-2xl font-bold text-foreground">{stats.cancelled}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-red-500"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentFilters filters={filters} onFiltersChange={setFilters} />
          </CardContent>
        </Card>

        {/* Appointments Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">Upcoming ({stats.upcoming})</TabsTrigger>
            <TabsTrigger value="past">Past ({stats.past})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>Your scheduled appointments</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Upcoming Appointments</h3>
                    <p className="text-muted-foreground mb-4">
                      {session.user.role === "buyer"
                        ? "Book your first appointment to get started"
                        : "No appointments scheduled yet"}
                    </p>
                    {session.user.role === "buyer" && (
                      <Link href="/buyer/appointment">
                        <Button>Book Appointment</Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAppointments.map((appointment: any) => (
                      <AppointmentCard
                        key={appointment._id}
                        appointment={appointment}
                        userRole={session.user.role}
                        onUpdate={handleAppointmentUpdate}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Past Appointments</CardTitle>
                <CardDescription>Your appointment history</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Past Appointments</h3>
                    <p className="text-muted-foreground">Your appointment history will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAppointments.map((appointment: any) => (
                      <AppointmentCard
                        key={appointment._id}
                        appointment={appointment}
                        userRole={session.user.role}
                        onUpdate={handleAppointmentUpdate}
                        isPast={true}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
