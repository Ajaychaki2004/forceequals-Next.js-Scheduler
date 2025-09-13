import NextAuth from "next-auth/next"
import GoogleProvider from "next-auth/providers/google"
import { MongoClient, ObjectId } from "mongodb"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import { UserRole } from "@/types/auth"

// Initialize MongoDB client
const client = new MongoClient(process.env.MONGODB_URI!)
const clientPromise = client.connect()

// Create MongoDB adapter
const mongoAdapter = MongoDBAdapter(clientPromise)

// Define interface for OAuth accounts
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

// Create a custom adapter that extends the MongoDB adapter
const adapter = {
  ...mongoAdapter,
  // Override specific methods to handle account linking
  async linkAccount(account: OAuthAccount) {
    try {
      const db = (await clientPromise).db()
      
      // First try to find if this account already exists
      const existingAccount = await db.collection("accounts").findOne({
        provider: account.provider,
        providerAccountId: account.providerAccountId,
      })
      
      if (existingAccount) {
        console.log("Account already exists, updating it")
        
        // Update the existing account
        await db.collection("accounts").updateOne(
          {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
          {
            $set: {
              userId: account.userId,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state,
              updated_at: new Date(),
            }
          }
        )
        
        return account
      }
      
      // Create a new account link
      await db.collection("accounts").insertOne({
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
      })
      
      return account
    } catch (error) {
      console.error("Error in linkAccount:", error)
      // Fall back to the original adapter's implementation
      if (mongoAdapter && typeof mongoAdapter.linkAccount === "function") {
        return mongoAdapter.linkAccount(account as any)
      }
      return account
    }
  }
}

// @ts-ignore - TypeScript issues with the custom adapter
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
  allowDangerousEmailAccountLinking: true,
  
  // Debug mode in development
  debug: process.env.NODE_ENV === "development",
  
  // Custom pages
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  
  // Session configuration
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Callbacks for authentication flow
  callbacks: {
    // Handle sign-in process
    // @ts-ignore - Type issues with NextAuth callbacks
    async signIn({ user, account, profile }) {
      // Skip if no account or user email
      if (!account || !user?.email) {
        return true
      }
      
      try {
        if (account.provider === "google") {
          const db = (await clientPromise).db()
          
          // Extract role from the callback URL
          let selectedRole: UserRole = "buyer"
          
          if (account.callbackUrl) {
            try {
              const callbackUrl = new URL(account.callbackUrl)
              const roleParam = callbackUrl.searchParams.get("role") as UserRole | null
              
              if (roleParam && (roleParam === "buyer" || roleParam === "seller")) {
                selectedRole = roleParam
                console.log(`Role detected from URL: ${selectedRole}`)
              }
            } catch (error) {
              console.error("Failed to parse callback URL:", error)
            }
          }
          
          // Check if a user with this email already exists
          const existingUser = await db.collection("users").findOne({ email: user.email })
          
          if (existingUser) {
            console.log("Existing user found with email:", user.email)
            
            // Update the existing user
            await db.collection("users").updateOne(
              { _id: existingUser._id },
              {
                $set: {
                  name: user.name,
                  image: user.image,
                  role: existingUser.role || selectedRole,
                  updatedAt: new Date(),
                }
              }
            )
            
            // Ensure this account is linked to the user
            const existingAccount = await db.collection("accounts").findOne({
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            })
            
            if (!existingAccount) {
              console.log("Linking new account to existing user")
              
              // Create account link
              await db.collection("accounts").insertOne({
                userId: existingUser._id.toString(),
                type: "oauth",
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
              })
            }
          } else {
            // New user
            console.log("Creating new user with email:", user.email)
            
            // Let the adapter create the user, but ensure it has a role
            await db.collection("users").insertOne({
              name: user.name,
              email: user.email,
              image: user.image,
              emailVerified: null,
              role: selectedRole,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          }
        }
        
        return true
      } catch (error) {
        console.error("Error in signIn callback:", error)
        // Still allow sign in even if our custom code fails
        return true
      }
    },
    
    // Customize session object
    // @ts-ignore - Type issues with NextAuth callbacks
    async session({ session, user }) {
      if (session.user && user) {
        try {
          console.log("Session callback for user:", user.id)
          
          const db = (await clientPromise).db()
          
          // Get the user from the database
          const dbUser = await db.collection("users").findOne({ _id: new ObjectId(user.id) })
          
          if (dbUser) {
            // Add user ID and role to session
            session.user.id = dbUser._id.toString()
            session.user.role = dbUser.role || "buyer"
            
            console.log(`User session role: ${session.user.role}`)
            
            // Ensure role exists in DB
            if (!dbUser.role) {
              console.log("Setting default role in database")
              await db.collection("users").updateOne(
                { _id: new ObjectId(user.id) },
                { $set: { role: "buyer" } }
              )
            }
          } else {
            console.warn("User found in session but not in database")
            session.user.role = "buyer"
          }
        } catch (error) {
          console.error("Error in session callback:", error)
          session.user.role = "buyer"
        }
      }
      
      return session
    },
  },
}

// Create NextAuth handler
// @ts-ignore - Ignore TypeScript errors with the custom adapter
const handler = NextAuth(authOptions as any)

// Export handler for API route
export { handler as GET, handler as POST }