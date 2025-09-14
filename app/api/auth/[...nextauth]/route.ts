import NextAuth from "next-auth/next"
import GoogleProvider from "next-auth/providers/google"
import { MongoClient, ObjectId } from "mongodb"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "@/lib/mongodb"

// Import directly from our centralized MongoDB connection
// This ensures consistent connection settings across the application

// Define interface for account
interface OAuthAccount {
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
}

// Create a custom adapter that extends MongoDB adapter with better account linking
const baseAdapter = MongoDBAdapter(clientPromise);
const adapter = {
  ...baseAdapter,
  // Override the linkAccount function to handle account linking better
  async linkAccount(account: OAuthAccount) {
    const db = (await clientPromise).db();
    
    // First, check if user exists by email
    if (account.userId) {
      const user = await db.collection("users").findOne({ _id: new ObjectId(account.userId) });
      
      if (user && user.email) {
        console.log(`Linking account for user: ${user.email}`);
        
        // Insert the account directly
        const result = await db.collection("accounts").insertOne({
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state,
          created_at: new Date(),
          updated_at: new Date(),
        });
        
        return account;
      }
    }
    
    // Fallback to default adapter behavior
    if (baseAdapter && typeof baseAdapter.linkAccount === 'function') {
      return baseAdapter.linkAccount(account);
    }
    return account;
  }
};

// @ts-ignore
export const authOptions = {
  adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/calendar.readonly",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  // Allow linking accounts by email - CRUCIAL for handling OAuthAccountNotLinked errors
  // This is safe since we're only using trusted providers (Google)
  allowDangerousEmailAccountLinking: true,
  
  // Explicitly set session strategy to database for persistence
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Debug mode to see detailed error messages
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    // @ts-ignore - Ignoring TypeScript errors in the signIn callback
    async signIn({ user, account, profile, email }) {
      if (!account || !user?.email) {
        return true;
      }
      
      try {
        if (account.provider === "google") {
          const db = (await clientPromise).db();
          
          // Extract role from the callback URL if it exists
          let selectedRole = "buyer"; // default role
          
          if (account.callbackUrl) {
            try {
              const callbackUrl = new URL(account.callbackUrl);
              const roleParam = callbackUrl.searchParams.get("role");
              if (roleParam && (roleParam === "buyer" || roleParam === "seller")) {
                selectedRole = roleParam;
                console.log(`Role detected from URL: ${selectedRole}`);
              } else {
                console.log(`No role param in callbackUrl: ${callbackUrl.toString()}`);
              }
            } catch (error) {
              console.error("Failed to parse callback URL:", error);
            }
          } else {
            console.log("No callbackUrl in account object");
          }
          
          // Debug information about the account
          console.log("Account object properties:", Object.keys(account));
          console.log("Account provider:", account.provider);
          console.log("Account providerAccountId:", account.providerAccountId);
          
          // Check if a user with this email already exists
          const existingUser = await db.collection("users").findOne({ email: user.email });
          
          if (existingUser) {
            console.log("Existing user found with same email", existingUser);
            
            // Update the role based on the selected role
            await db.collection("users").updateOne(
              { _id: existingUser._id },
              {
                $set: {
                  role: selectedRole,
                  refreshToken: account.refresh_token,
                  accessToken: account.access_token,
                  updatedAt: new Date(),
                }
              }
            );
            
            // Force account linking by removing any existing accounts with the same provider+providerAccountId
            // This prevents the OAuthAccountNotLinked error
            await db.collection("accounts").deleteMany({
              provider: "google",
              providerAccountId: account.providerAccountId,
            });
            
            // Create a fresh account link
            await db.collection("accounts").insertOne({
              userId: existingUser._id.toString(),
              type: "oauth",
              provider: "google",
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state,
              created_at: new Date(),
              updated_at: new Date(),
            });
            
            console.log("Successfully linked Google account to existing user");
          } else {
            // New user, will be created by the adapter
            console.log(`New user signing in with Google with role: ${selectedRole}`);
            
            // For new users, we'll create the user document with the selected role
            await db.collection("users").insertOne({
              name: user.name,
              email: user.email,
              image: user.image,
              emailVerified: null,
              role: selectedRole,
              refreshToken: account.refresh_token,
              accessToken: account.access_token,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }
        
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        
        // Improve error handling for MongoDB connection issues
        if (error instanceof Error && error.message.includes('SSL routines')) {
          console.error("MongoDB SSL/TLS connection error. Check your connection string and certificates.");
        }
        
        // Still allow sign in even if our custom code fails
        return true;
      }
    },
    // @ts-ignore
    async session({ session, user, token, req }) {
      // Add role to session and ensure it exists
      if (session.user && user) {
        try {
          console.log("Session callback called with user:", user.id);
          
          // Check if we have a role cookie in the request
          const cookies = req?.cookies || {};
          const roleCookie = cookies?.selectedRole;
          
          if (roleCookie) {
            console.log(`Found role cookie: ${roleCookie}`);
          }
          
          // Add retry logic for database connection
          let db;
          try {
            const client = await clientPromise;
            db = client.db();
            console.log("MongoDB connection successful");
          } catch (dbError) {
            console.error("MongoDB connection error:", dbError);
            // Add fallback role in case of database connection failure
            session.user.role = session.user.role || "buyer";
            session.user.id = user.id;
            return session;
          }
          
          // Get the user from the database to check their role
          const dbUser = await db.collection("users").findOne({ _id: new ObjectId(user.id) });
          console.log("Database user found:", dbUser ? "yes" : "no");
          
          if (dbUser) {
            // Use role from cookie if available, otherwise from DB
            let userRole = dbUser.role;
            
            // If we have a valid role cookie, override the DB role
            if (roleCookie && (roleCookie === "buyer" || roleCookie === "seller")) {
              console.log(`Using role from cookie: ${roleCookie} instead of DB role: ${dbUser.role || "none"}`);
              userRole = roleCookie;
              
              // Also update the database with this role
              await db.collection("users").updateOne(
                { _id: new ObjectId(user.id) },
                { $set: { role: roleCookie } }
              );
            }
            
            // Add the role to the session
            session.user.role = userRole || "buyer";
            session.user.id = dbUser._id.toString();
            console.log(`Setting session user role to: ${session.user.role}`);
            
            // Get the most recent account for this user
            const account = await db.collection("accounts").findOne(
              { userId: dbUser._id.toString() },
              { sort: { created_at: -1 } }
            );
            
            console.log("Latest account:", account ? account.provider : "none");
            
            // Ensure the role is set in the database if it doesn't exist
            if (!userRole) {
              console.log("No role found, setting default role: buyer");
              await db.collection("users").updateOne(
                { _id: new ObjectId(user.id) },
                { $set: { role: "buyer" } }
              );
              session.user.role = "buyer";
            }
          } else {
            console.warn("User not found in database but exists in session");
            session.user.role = "buyer"; // Default fallback
          }
        } catch (error) {
          console.error("Error in session callback:", error);
          // Set default role if there's an error
          session.user.role = session.user.role || "buyer";
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
}

// @ts-ignore
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
