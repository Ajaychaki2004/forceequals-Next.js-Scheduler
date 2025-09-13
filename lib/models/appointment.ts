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

    return (await db.collection("appointments").find({ buyerId }).sort({ startTime: 1 }).toArray()) as Appointment[]
  }

  static async findBySellerId(sellerId: string): Promise<Appointment[]> {
    const client = await clientPromise
    const db = client.db()

    return (await db.collection("appointments").find({ sellerId }).sort({ startTime: 1 }).toArray()) as Appointment[]
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

    const query =
      userRole === "buyer"
        ? { buyerId: userId, startTime: { $gte: new Date() } }
        : { sellerId: userId, startTime: { $gte: new Date() } }

    return (await db.collection("appointments").find(query).sort({ startTime: 1 }).toArray()) as Appointment[]
  }
}
