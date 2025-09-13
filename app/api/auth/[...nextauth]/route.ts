import NextAuth from "next-auth/next"
import GoogleProvider from "next-auth/providers/google"
import { MongoClient, ObjectId } from "mongodb"
import { MongoDBAdapter } from "@auth/mongodb-adapter"

const client = new MongoClient(process.env.MONGODB_URI!)
const clientPromise = client.connect()

// We'll create a direct MongoDB adapter here to avoid the OAuthAccountNotLinked error
const adapter = MongoDBAdapter(clientPromise)

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
  // Fix for OAuthAccountNotLinked error
  // Allow linking accounts
  allowDangerousEmailAccountLinking: true,
  
  // Debug mode to see detailed error messages
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    // @ts-ignore
    async signIn({ user, account, profile, email }) {
      // Before sign in, we need to handle the potential OAuthAccountNotLinked error
      // This happens when a user tries to sign in with a provider but already has an account
      // with the same email using a different provider
      
      try {
        if (account?.provider === "google") {
          const db = (await clientPromise).db();
          
          // Check if a user with this email already exists
          const existingUser = await db.collection("users").findOne({ email: user.email });
          
          if (existingUser) {
            console.log("Existing user found with same email", existingUser);
            
            // Check if this Google account is already linked to the user
            const existingAccount = await db.collection("accounts").findOne({
              provider: "google",
              providerAccountId: account.providerAccountId,
            });
            
            if (!existingAccount) {
              console.log("Account not found, linking new Google account to existing user");
              
              // Link this Google account to the existing user
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
              
              // Store the tokens for Google Calendar access
              await db.collection("users").updateOne(
                { _id: existingUser._id },
                {
                  $set: {
                    refreshToken: account.refresh_token,
                    accessToken: account.access_token,
                    updatedAt: new Date(),
                  }
                }
              );
            }
          } else {
            // New user, will be created by the adapter
            console.log("New user signing in with Google");
            
            // We'll set the default role after the user is created in the session callback
          }
        }
        
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        // Still allow sign in even if our custom code fails
        return true;
      }
    },
    // @ts-ignore
    async session({ session, user, token }) {
      // Add role to session and ensure it exists
      if (session.user && user) {
        const db = (await clientPromise).db();
        
        // Get the user from the database to check their role
        const dbUser = await db.collection("users").findOne({ _id: new ObjectId(user.id) });
        
        if (dbUser) {
          // Use existing role if available, or set default
          session.user.role = dbUser.role || "buyer";
          session.user.id = dbUser._id.toString();
          
          // Ensure the role is set in the database
          if (!dbUser.role) {
            await db.collection("users").updateOne(
              { _id: new ObjectId(user.id) },
              { $set: { role: "buyer" } }
            );
          }
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  session: {
    strategy: "database",
  },
}

// @ts-ignore
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
