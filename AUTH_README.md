# NextAuth.js Role-Based Authentication

This application implements a robust authentication system with Next.js and NextAuth.js, featuring Google OAuth integration, MongoDB for user storage, and role-based access control.

## Authentication Features

- **Google OAuth Integration**: Users can sign in with their Google accounts
- **Role-Based Access**: Users can be either "buyers" or "sellers" with different access rights
- **Account Linking**: Multiple sign-in methods for the same email address
- **Role Switching**: Users can toggle between buyer and seller modes
- **Persistent Sessions**: User roles and authentication state persist between visits
- **Protected Routes**: Routes are protected based on user roles

## Project Structure

### Authentication Flow

1. User visits `/auth/signin` with optional `?role=buyer|seller` parameter
2. User authenticates with Google OAuth
3. NextAuth.js handles the OAuth flow and account linking
4. User role is saved in the database and session
5. User is redirected to their role-specific dashboard

### Key Files

- **`/app/api/auth/[...nextauth]/route.ts`**: NextAuth.js configuration with custom callbacks
- **`/app/api/auth/update-role/route.ts`**: API endpoint to update user roles
- **`/lib/auth.ts`**: Auth utilities for protecting routes by role
- **`/lib/role-routes.json`**: Configuration for role-based redirects
- **`/types/auth.ts`**: TypeScript definitions for auth-related types
- **`/components/role-switcher-button.tsx`**: UI component for switching roles
- **`/components/role-updater-client.tsx`**: Client component to update roles from URL params

## Protecting Routes

To protect a route based on role:

```typescript
// In a server component (page.tsx)
import { requireRole } from "@/lib/auth";

export default async function SellerDashboardPage() {
  // This will redirect to buyer page if not a seller
  const session = await requireRole("seller");
  
  return (
    <div>
      <h1>Seller Dashboard</h1>
      {/* Rest of the page */}
    </div>
  );
}
```

## Role Switching

The application includes a role switcher button in the header that allows users to switch between buyer and seller roles. The implementation:

1. Calls the `/api/auth/update-role` endpoint with the new role
2. Updates the user's role in the database
3. Updates the client-side session with the new role
4. Redirects to the appropriate dashboard for the new role

## Environment Setup

Required environment variables:

```
MONGODB_URI=mongodb://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

## TypeScript Integration

Custom type definitions extend the default NextAuth types to support roles:

```typescript
// types/auth.ts
export type UserRole = "buyer" | "seller";

export interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: UserRole;
}

export interface ExtendedSession {
  user?: ExtendedUser;
  expires: string;
}
```