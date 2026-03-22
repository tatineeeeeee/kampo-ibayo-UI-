import { Tables } from "@/database.types";

/** Base user type from Supabase (auto-generated) */
export type UserRow = Tables<"users">;

/** User role union type */
export type UserRole = "admin" | "staff" | "user";

/** Authenticated user info (from serverAuth) */
export interface AuthenticatedUser {
  authId: string;
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  isSuperAdmin: boolean;
}

/** Auth result from server-side validation */
export interface AuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
  status?: number;
}

/** User loyalty status levels */
export type LoyaltyStatus = "New" | "Regular" | "VIP" | "Elite";
