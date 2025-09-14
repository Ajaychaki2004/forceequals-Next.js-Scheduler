"use strict";

/**
 * This is a diagnostic script to test MongoDB connection and appointments collection
 * Run with: node test-mongodb.js
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI environment variable");
  process.exit(1);
}

async function main() {
  console.log("Starting MongoDB connection test...");
  
  // Connect to MongoDB
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    
    // Get database
    const db = client.db();
    console.log(`🗄️ Connected to database: ${db.databaseName}`);
    
    // List collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log(`📚 Available collections: ${collectionNames.join(', ')}`);
    
    // Check if appointments collection exists
    const appointmentsExists = collectionNames.includes('appointments');
    console.log(`🔍 Appointments collection exists: ${appointmentsExists}`);
    
    if (appointmentsExists) {
      // Count documents in appointments
      const count = await db.collection('appointments').countDocuments({});
      console.log(`📊 Appointments collection contains ${count} documents`);
      
      if (count > 0) {
        // Get a sample of appointments
        const sample = await db.collection('appointments').find({}).limit(5).toArray();
        console.log(`📋 Sample appointments (${Math.min(5, count)} of ${count}):`);
        sample.forEach((apt, i) => {
          console.log(`\n--- Appointment ${i+1} ---`);
          console.log(`ID: ${apt._id}`);
          console.log(`Title: ${apt.title}`);
          console.log(`Buyer: ${apt.buyerName} (${apt.buyerEmail}) - ID: ${apt.buyerId}`);
          console.log(`Seller: ${apt.sellerName} (${apt.sellerEmail}) - ID: ${apt.sellerId}`);
          console.log(`Status: ${apt.status}`);
          console.log(`Time: ${new Date(apt.startTime).toLocaleString()} - ${new Date(apt.endTime).toLocaleString()}`);
        });
      }
      
      // Create a test appointment
      const testAppointment = {
        buyerId: new ObjectId().toString(),
        buyerEmail: "test-buyer@example.com",
        buyerName: "Test Buyer",
        sellerId: new ObjectId().toString(),
        sellerEmail: "test-seller@example.com",
        sellerName: "Test Seller",
        eventId: `test-event-${Date.now()}`,
        title: "Diagnostic Test Appointment",
        description: "Created via diagnostic script",
        startTime: new Date(Date.now() + 86400000), // tomorrow
        endTime: new Date(Date.now() + 86400000 + 3600000), // tomorrow + 1 hour
        status: "scheduled",
        meetingLink: "https://meet.example.com/test",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log("\n🔧 Creating test appointment...");
      const result = await db.collection('appointments').insertOne(testAppointment);
      console.log(`✅ Test appointment created with ID: ${result.insertedId}`);
      
      // Verify appointment was created
      const createdAppointment = await db.collection('appointments').findOne({ _id: result.insertedId });
      if (createdAppointment) {
        console.log("✅ Successfully retrieved test appointment");
      } else {
        console.log("❌ Failed to retrieve test appointment");
      }
      
      // Clean up test appointment
      console.log("🧹 Cleaning up test appointment...");
      await db.collection('appointments').deleteOne({ _id: result.insertedId });
      console.log("✅ Test appointment deleted");
    } else {
      // Create appointments collection if it doesn't exist
      console.log("📝 Creating appointments collection...");
      await db.createCollection('appointments');
      console.log("✅ Appointments collection created");
    }
    
    console.log("\n✅ MongoDB test completed successfully");
  } catch (error) {
    console.error("❌ MongoDB test failed:", error);
  } finally {
    await client.close();
    console.log("🔌 MongoDB connection closed");
  }
}

main().catch(console.error);