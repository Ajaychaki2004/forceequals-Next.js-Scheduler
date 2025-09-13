"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Calendar, Clock, User, Video, MoreHorizontal, Phone, Mail } from "lucide-react"

interface AppointmentCardProps {
  appointment: any
  userRole: "buyer" | "seller"
  onUpdate: (appointmentId: string, updates: any) => void
  isPast?: boolean
}

export function AppointmentCard({ appointment, userRole, onUpdate, isPast = false }: AppointmentCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "default"
      case "completed":
        return "secondary"
      case "cancelled":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/appointments/${appointment._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        onUpdate(appointment._id, { status: newStatus })
      }
    } catch (error) {
      console.error("Error updating appointment:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isUpcoming = new Date(appointment.startTime) > new Date()
  const otherParty = userRole === "buyer" ? appointment.sellerName : appointment.buyerName
  const otherPartyEmail = userRole === "buyer" ? appointment.sellerEmail : appointment.buyerEmail

  return (
    <Card className={`transition-all hover:shadow-md ${appointment.status === "cancelled" ? "opacity-75" : ""}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-lg font-semibold text-foreground">{appointment.title}</h3>
              <Badge variant={getStatusColor(appointment.status)}>{appointment.status}</Badge>
              {isUpcoming && !isPast && (
                <Badge variant="outline" className="text-xs">
                  Upcoming
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(appointment.startTime)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>
                    {userRole === "buyer" ? "With" : "Client"}: {otherParty}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {appointment.meetingLink && (
                  <div className="flex items-center gap-2 text-sm">
                    <Video className="h-4 w-4 text-primary" />
                    <a
                      href={appointment.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Join Meeting
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{otherPartyEmail}</span>
                </div>
              </div>
            </div>

            {appointment.description && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">{appointment.description}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              {appointment.meetingLink && isUpcoming && (
                <Button size="sm" asChild>
                  <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer">
                    <Video className="h-4 w-4 mr-2" />
                    Join Meeting
                  </a>
                </Button>
              )}
              {isUpcoming && (
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact
                </Button>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={isUpdating}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Details</DropdownMenuItem>
              {isUpcoming && appointment.status === "scheduled" && (
                <>
                  <DropdownMenuItem>Reschedule</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleStatusUpdate("completed")}>Mark as Completed</DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate("cancelled")}
                    className="text-destructive focus:text-destructive"
                  >
                    Cancel Appointment
                  </DropdownMenuItem>
                </>
              )}
              {isPast && appointment.status === "scheduled" && (
                <DropdownMenuItem onClick={() => handleStatusUpdate("completed")}>Mark as Completed</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
