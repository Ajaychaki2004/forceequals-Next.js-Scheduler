import { requireAuth } from "@/lib/auth"
import { AppointmentsView } from "@/components/appointments/appointments-view"

export default async function AppointmentsPage() {
  const session = await requireAuth()

  return <AppointmentsView session={session} />
}
