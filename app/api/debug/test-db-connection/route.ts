import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

// Debugging endpoint to check MongoDB connection status
export async function GET() {
  try {
    console.log("Testing MongoDB connection...")
    
    const client = await clientPromise
    const db = client.db()
    
    // Simple ping to verify connection
    const ping = await db.command({ ping: 1 })
    
    // Get server information
    const serverInfo = await db.command({ serverStatus: 1 })
    
    // Get list of collections as another verification
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map(c => c.name)
    
    return NextResponse.json({
      status: "Connected",
      ping: ping.ok === 1 ? "Successful" : "Failed",
      databaseName: db.databaseName,
      collections: collectionNames,
      connectionInfo: {
        host: serverInfo.host,
        version: serverInfo.version,
        process: serverInfo.process,
        uptime: serverInfo.uptime,
        localTime: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("MongoDB connection test failed:", error)
    
    return NextResponse.json({
      status: "Connection Failed",
      error: error instanceof Error ? error.message : "Unknown error",
      errorName: error instanceof Error ? error.name : "Unknown error type",
      stack: error instanceof Error ? error.stack : undefined,
      time: new Date().toISOString()
    }, { status: 500 })
  }
}