import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export interface Appointment {
  _id?: ObjectId
  buyerId: string
  buyerEmail: string
  buyerName: string
  sellerId: string
  sellerEmail: string
  sellerName: string
  eventId: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  status: "scheduled" | "cancelled" | "completed"
  meetingLink?: string
  createdAt: Date
  updatedAt: Date
}

export class AppointmentModel {
  static async create(appointmentData: Omit<Appointment, "_id" | "createdAt" | "updatedAt">) {
    const client = await clientPromise
    const db = client.db()

    const appointment = {
      ...appointmentData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("appointments").insertOne(appointment)
    return { ...appointment, _id: result.insertedId }
  }

  static async findById(id: string): Promise<Appointment | null> {
    const client = await clientPromise
    const db = client.db()

    return (await db.collection("appointments").findOne({ _id: new ObjectId(id) })) as Appointment | null
  }

  static async findByBuyerId(buyerId: string): Promise<Appointment[]> {
    const client = await clientPromise
    const db = client.db()
    
    // Try to handle both string ID and ObjectId formats by using $or operator
    const query = {
      $or: [
        { buyerId },
        { buyerId: buyerId.toString() },
        // Try to convert to ObjectId if it's a valid format
        ...(ObjectId.isValid(buyerId) ? [{ buyerId: new ObjectId(buyerId) }] : [])
      ]
    }
    
    console.log("Finding appointments for buyerId:", buyerId, "with query:", JSON.stringify(query))
    return (await db.collection("appointments").find(query).sort({ startTime: 1 }).toArray()) as Appointment[]
  }

  static async findBySellerId(sellerId: string): Promise<Appointment[]> {
    const client = await clientPromise
    const db = client.db()
    
    // Try to handle both string ID and ObjectId formats by using $or operator
    const query = {
      $or: [
        { sellerId },
        { sellerId: sellerId.toString() },
        // Try to convert to ObjectId if it's a valid format
        ...(ObjectId.isValid(sellerId) ? [{ sellerId: new ObjectId(sellerId) }] : [])
      ]
    }
    
    console.log("Finding appointments for sellerId:", sellerId, "with query:", JSON.stringify(query))
    return (await db.collection("appointments").find(query).sort({ startTime: 1 }).toArray()) as Appointment[]
  }

  static async findByEventId(eventId: string): Promise<Appointment | null> {
    const client = await clientPromise
    const db = client.db()

    return (await db.collection("appointments").findOne({ eventId })) as Appointment | null
  }

  static async updateStatus(id: string, status: Appointment["status"]) {
    const client = await clientPromise
    const db = client.db()

    return await db.collection("appointments").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      },
    )
  }

  static async delete(id: string) {
    const client = await clientPromise
    const db = client.db()

    return await db.collection("appointments").deleteOne({ _id: new ObjectId(id) })
  }

  static async findUpcoming(userId: string, userRole: "buyer" | "seller"): Promise<Appointment[]> {
    const client = await clientPromise
    const db = client.db()

    // Build ID query with flexible matching for both string and ObjectId formats
    const idQuery = {
      $or: [
        { [userRole === "buyer" ? "buyerId" : "sellerId"]: userId },
        { [userRole === "buyer" ? "buyerId" : "sellerId"]: userId.toString() },
        // Try to convert to ObjectId if it's a valid format
        ...(ObjectId.isValid(userId) ? [{ [userRole === "buyer" ? "buyerId" : "sellerId"]: new ObjectId(userId) }] : [])
      ]
    }
    
    // Combine with date filter
    const query = {
      $and: [
        idQuery,
        { startTime: { $gte: new Date() } }
      ]
    }
    
    console.log(`Finding upcoming appointments for ${userRole} ID:`, userId, "with query:", JSON.stringify(query))
    return (await db.collection("appointments").find(query).sort({ startTime: 1 }).toArray()) as Appointment[]
  }
}
