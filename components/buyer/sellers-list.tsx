"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Calendar, CheckCircle } from "lucide-react"

interface SellersListProps {
  sellers: any[]
  onSellerSelect: (seller: any) => void
}

export function SellersList({ sellers, onSellerSelect }: SellersListProps) {
  if (sellers.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Sellers Found</h3>
        <p className="text-muted-foreground">Try adjusting your search criteria</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sellers.map((seller, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{seller.name}</h3>
                  <p className="text-sm text-muted-foreground">{seller.email}</p>
                </div>
              </div>
              {seller.isCalendarConnected && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Available
                </Badge>
              )}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Calendar connected</span>
              </div>
            </div>

            <Button onClick={() => onSellerSelect(seller)} className="w-full" disabled={!seller.isCalendarConnected}>
              {seller.isCalendarConnected ? "Book Appointment" : "Unavailable"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
