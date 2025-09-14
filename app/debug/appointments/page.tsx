"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function DebugAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAllAppointments()
  }, [])

  const fetchAllAppointments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch("/api/debug/list-all-appointments")
      
      if (!response.ok) {
        throw new Error(`Failed to fetch appointments: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("All appointments:", data)
      
      if (data && Array.isArray(data.appointments)) {
        setAppointments(data.appointments)
      } else {
        setAppointments([])
        setError("Unexpected response format")
      }
    } catch (error) {
      console.error("Error fetching appointments:", error)
      setError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString || "Invalid date"
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Appointment Database Debugger</CardTitle>
          <CardDescription>
            Direct access to all appointments in the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Total Appointments: <span className="font-medium">{appointments.length}</span>
              </p>
            </div>
            <Button onClick={fetchAllAppointments} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading appointments...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-medium mb-2">No appointments found</p>
          <p className="text-muted-foreground">There are no appointments in the database.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment, index) => (
            <Card key={appointment._id || index}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{appointment.title || "Untitled"}</h3>
                    <p className="text-muted-foreground">{appointment.description || "No description"}</p>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <Badge>
                      {appointment.status || "Unknown"}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium">Appointment ID</p>
                    <p className="text-xs text-muted-foreground break-all">{appointment._id || "None"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Event ID</p>
                    <p className="text-xs text-muted-foreground break-all">{appointment.eventId || "None"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Meeting Link</p>
                    <p className="text-xs text-muted-foreground break-all">
                      {appointment.meetingLink ? (
                        <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {appointment.meetingLink}
                        </a>
                      ) : "None"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium">Buyer</p>
                    <p className="text-xs">Name: {appointment.buyerName || "Unknown"}</p>
                    <p className="text-xs">Email: {appointment.buyerEmail || "Unknown"}</p>
                    <p className="text-xs">ID: {appointment.buyerId || "Unknown"}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium">Seller</p>
                    <p className="text-xs">Name: {appointment.sellerName || "Unknown"}</p>
                    <p className="text-xs">Email: {appointment.sellerEmail || "Unknown"}</p>
                    <p className="text-xs">ID: {appointment.sellerId || "Unknown"}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Start Time</p>
                    <p className="text-xs text-muted-foreground">{formatDate(appointment.startTime)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">End Time</p>
                    <p className="text-xs text-muted-foreground">{formatDate(appointment.endTime)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}