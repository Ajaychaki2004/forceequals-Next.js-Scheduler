import { requireRole } from "@/lib/auth"
import { BuyerAppointmentBooking } from "@/components/buyer/buyer-appointment-booking"

export default async function BuyerAppointmentPage() {
  const session = await requireRole("buyer")

  return <BuyerAppointmentBooking session={session} />
}
