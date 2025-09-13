import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Clock, Users, TrendingUp } from "lucide-react"

interface DashboardStatsProps {
  appointments: any[]
}

export function DashboardStats({ appointments }: DashboardStatsProps) {
  const today = new Date()
  const thisWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

  const todayAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.startTime)
    return aptDate.toDateString() === today.toDateString()
  })

  const weekAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.startTime)
    return aptDate >= today && aptDate <= thisWeek
  })

  const totalAppointments = appointments.length
  const completedAppointments = appointments.filter((apt) => apt.status === "completed").length

  const stats = [
    {
      title: "Today's Appointments",
      value: todayAppointments.length,
      icon: Clock,
      description: "Scheduled for today",
    },
    {
      title: "This Week",
      value: weekAppointments.length,
      icon: CalendarDays,
      description: "Upcoming this week",
    },
    {
      title: "Total Appointments",
      value: totalAppointments,
      icon: Users,
      description: "All time bookings",
    },
    {
      title: "Completion Rate",
      value: totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0,
      icon: TrendingUp,
      description: "Success rate",
      suffix: "%",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stat.value}
              {stat.suffix}
            </div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
