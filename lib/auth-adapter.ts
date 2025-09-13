import { MongoDBAdapter } from "@auth/mongodb-adapter"
import { ObjectId } from "mongodb"
import type { Adapter } from "next-auth/adapters"

/**
 * Custom MongoDB adapter that handles account linking
 * This extends the standard MongoDBAdapter to fix the OAuthAccountNotLinked error
 */
export function createMongoDBAdapter(clientPromise: Promise<any>): Adapter {
  // Get the standard adapter
  const adapter = MongoDBAdapter(clientPromise) as Adapter
  
  // Customize the linkAccount function to handle linking accounts with the same email
  const originalLinkAccount = adapter.linkAccount
  
  if (originalLinkAccount) {
    // @ts-ignore - We know account might have any type
    adapter.linkAccount = async (account) => {
      try {
        // Try to use the original link account function
        return await originalLinkAccount(account)
      } catch (error: any) {
        // If there's an OAuthAccountNotLinked error, we'll handle it
        if (error.message && error.message.includes("OAuthAccountNotLinked")) {
          // Get MongoDB client
          const client = await clientPromise
          const db = client.db()
          
          // Find the user with the email from the account
          const existingAccount = await db.collection("accounts").findOne({
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          })
          
          if (existingAccount) {
            // Account already exists, update it
            await db.collection("accounts").updateOne(
              { _id: new ObjectId(existingAccount._id) },
              {
                $set: {
                  access_token: account.access_token,
                  refresh_token: account.refresh_token,
                  expires_at: account.expires_at,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state,
                  updated_at: new Date(),
                },
              }
            )
            return existingAccount
          } else {
            // Create a new account and link it to the user
            const user = await db.collection("users").findOne({
              email: account.user.email,
            })
            
            if (user) {
              // Create new account linked to the existing user
              const accountToCreate = {
                ...account,
                userId: user._id.toString(),
              }
              
              const result = await db.collection("accounts").insertOne({
                ...accountToCreate,
                created_at: new Date(),
                updated_at: new Date(),
              })
              
              return {
                ...accountToCreate,
                id: result.insertedId.toString(),
              }
            }
          }
        }
        // Re-throw the error if we couldn't handle it
        throw error
      }
    }
  }
  
  return adapter
}