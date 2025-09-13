import { requireRole } from "@/lib/auth"
import { SellerDashboard } from "@/components/seller/seller-dashboard"

export default async function SellerDashboardPage() {
  const session = await requireRole("seller")

  return <SellerDashboard session={session} />
}
