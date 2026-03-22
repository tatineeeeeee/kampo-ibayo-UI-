import { supabase } from "../../supabaseClient";
import { TablesInsert, TablesUpdate } from "@/database.types";

/**
 * User Service - Wraps all client-side Supabase queries for the users table.
 * Queries are unchanged from their original inline usage; only relocated here.
 */
export const userService = {
  /** Fetch all users ordered by creation date (admin) */
  async fetchAll() {
    return supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });
  },

  /** Fetch users with limited fields for reports */
  async fetchForReports() {
    return supabase
      .from("users")
      .select("email, full_name, phone, created_at, role")
      .order("created_at", { ascending: false });
  },

  /** Fetch a user's role by auth ID */
  async fetchRoleByAuthId(authId: string) {
    return supabase
      .from("users")
      .select("role")
      .eq("auth_id", authId)
      .single();
  },

  /** Fetch user profile by auth ID */
  async fetchProfileByAuthId(authId: string) {
    return supabase
      .from("users")
      .select("full_name, email, phone")
      .eq("auth_id", authId)
      .single();
  },

  /** Fetch user with role info by auth ID */
  async fetchWithRoleByAuthId(authId: string) {
    return supabase
      .from("users")
      .select("full_name, email, phone, role")
      .eq("auth_id", authId)
      .single();
  },

  /** Fetch user role and identity by auth ID */
  async fetchRoleAndIdentityByAuthId(authId: string) {
    return supabase
      .from("users")
      .select("role, full_name, email")
      .eq("auth_id", authId)
      .single();
  },

  /** Fetch user role and ID by auth ID */
  async fetchRoleAndIdByAuthId(authId: string) {
    return supabase
      .from("users")
      .select("role, id")
      .eq("auth_id", authId)
      .single();
  },

  /** Fetch full user by auth ID */
  async fetchByAuthId(authId: string) {
    return supabase
      .from("users")
      .select("*")
      .eq("auth_id", authId)
      .single();
  },

  /** Check if a user exists by email */
  async fetchByEmail(email: string) {
    return supabase
      .from("users")
      .select("email")
      .eq("email", email.toLowerCase());
  },

  /** Check which auth_ids exist (for bulk user existence check) */
  async checkExistByAuthIds(authIds: string[]) {
    return supabase
      .from("users")
      .select("auth_id")
      .in("auth_id", authIds);
  },

  /** Check if a single auth_id exists */
  async checkExistByAuthId(authId: string) {
    return supabase
      .from("users")
      .select("auth_id")
      .eq("auth_id", authId);
  },

  /** Fetch recently created users (for admin notifications) */
  async fetchRecentlyCreated(since: string) {
    return supabase
      .from("users")
      .select("id")
      .gte("created_at", since);
  },

  /** Create a new user */
  async create(userData: TablesInsert<"users">) {
    return supabase.from("users").insert(userData);
  },

  /** Update a user by ID */
  async updateById(userId: string, updateData: TablesUpdate<"users">) {
    return supabase.from("users").update(updateData).eq("id", userId);
  },

  /** Update a user by auth ID */
  async updateByAuthId(authId: string, updateData: TablesUpdate<"users">) {
    return supabase.from("users").update(updateData).eq("auth_id", authId);
  },
};
