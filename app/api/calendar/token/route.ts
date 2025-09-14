import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    // Get the current session to verify authentication
    // @ts-ignore - Ignore type issues with authOptions
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 });
    }

    // Only allow users to fetch their own token or admins to fetch any token
    // @ts-ignore - Custom role property may not be in type definition
    if (session.user.email !== email && session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db();
    
    // Find the user in the database
    const user = await db.collection('users').findOne({ email });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return the refresh token if it exists
    return NextResponse.json({ 
      refreshToken: user.refreshToken || null,
      isCalendarConnected: user.isCalendarConnected || false 
    });
  } catch (error) {
    console.error("Error fetching refresh token:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}