import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import CryptoJS from "crypto-js"

export interface Seller {
  _id?: ObjectId
  googleId: string
  name: string
  email: string
  refreshToken: string
  role: "seller"
  isCalendarConnected: boolean
  createdAt: Date
  updatedAt: Date
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-key-change-in-production"

export class SellerModel {
  static async create(sellerData: Omit<Seller, "_id" | "createdAt" | "updatedAt">) {
    const client = await clientPromise
    const db = client.db()

    // Encrypt refresh token before storing
    const encryptedRefreshToken = CryptoJS.AES.encrypt(sellerData.refreshToken, ENCRYPTION_KEY).toString()

    const seller = {
      ...sellerData,
      refreshToken: encryptedRefreshToken,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("sellers").insertOne(seller)
    return { ...seller, _id: result.insertedId }
  }

  static async findByEmail(email: string): Promise<Seller | null> {
    const client = await clientPromise
    const db = client.db()

    const seller = await db.collection("sellers").findOne({ email })
    if (!seller) return null

    // Decrypt refresh token
    const decryptedRefreshToken = CryptoJS.AES.decrypt(seller.refreshToken, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8)

    return {
      ...seller,
      refreshToken: decryptedRefreshToken,
    } as Seller
  }

  static async findById(id: string): Promise<Seller | null> {
    const client = await clientPromise
    const db = client.db()

    const seller = await db.collection("sellers").findOne({ _id: new ObjectId(id) })
    if (!seller) return null

    // Decrypt refresh token
    const decryptedRefreshToken = CryptoJS.AES.decrypt(seller.refreshToken, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8)

    return {
      ...seller,
      refreshToken: decryptedRefreshToken,
    } as Seller
  }

  static async findAll(): Promise<Seller[]> {
    const client = await clientPromise
    const db = client.db()

    const sellers = await db.collection("sellers").find({ role: "seller" }).toArray()

    return sellers.map((seller) => ({
      ...seller,
      refreshToken: CryptoJS.AES.decrypt(seller.refreshToken, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8),
    })) as Seller[]
  }

  static async updateRefreshToken(email: string, refreshToken: string) {
    const client = await clientPromise
    const db = client.db()

    const encryptedRefreshToken = CryptoJS.AES.encrypt(refreshToken, ENCRYPTION_KEY).toString()

    return await db.collection("sellers").updateOne(
      { email },
      {
        $set: {
          refreshToken: encryptedRefreshToken,
          isCalendarConnected: true,
          updatedAt: new Date(),
        },
      },
    )
  }

  static async updateCalendarConnection(email: string, isConnected: boolean) {
    const client = await clientPromise
    const db = client.db()

    return await db.collection("sellers").updateOne(
      { email },
      {
        $set: {
          isCalendarConnected: isConnected,
          updatedAt: new Date(),
        },
      },
    )
  }
}
