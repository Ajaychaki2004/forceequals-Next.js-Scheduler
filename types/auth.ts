// Define custom types for auth and role functionality

// Define valid roles in the application
export type UserRole = "buyer" | "seller";

// Extended user type with role
export interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: UserRole;
}

// Extended session type
export interface ExtendedSession {
  user?: ExtendedUser;
  expires: string;
}

// Define route configuration types
export interface RoleRoutes {
  routes: Record<string, UserRole>;
  defaultRedirects: Record<UserRole, string>;
}