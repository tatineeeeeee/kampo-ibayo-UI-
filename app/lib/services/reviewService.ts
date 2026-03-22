import { supabase } from "../../supabaseClient";
import { TablesInsert } from "@/database.types";

/**
 * Review Service - Wraps all client-side Supabase queries for guest_reviews and review_photos.
 * Queries are unchanged from their original inline usage; only relocated here.
 */
export const reviewService = {
  /** Fetch approved reviews (ratings only, for stats) */
  async fetchApprovedRatings() {
    return supabase
      .from("guest_reviews")
      .select("rating")
      .eq("approved", true);
  },

  /** Fetch approved reviews for display */
  async fetchApprovedForDisplay() {
    return supabase
      .from("guest_reviews")
      .select("id, guest_name, rating, review_text, approved, created_at")
      .eq("approved", true);
  },

  /** Fetch approved reviews with count */
  async fetchApprovedWithCount() {
    return supabase
      .from("guest_reviews")
      .select("*", { count: "exact" })
      .eq("approved", true);
  },

  /** Fetch unapproved reviews (for admin notifications) */
  async fetchUnapproved() {
    return supabase
      .from("guest_reviews")
      .select("id, guest_name, created_at")
      .eq("approved", false);
  },

  /** Fetch approved reviews (for admin notifications) */
  async fetchApprovedNotifications() {
    return supabase
      .from("guest_reviews")
      .select("id, guest_name, rating, created_at")
      .eq("approved", true);
  },

  /** Fetch approved reviews for auth page testimonials */
  async fetchTestimonials() {
    return supabase
      .from("guest_reviews")
      .select("rating, review_text, guest_name")
      .eq("approved", true);
  },

  /** Fetch reviews for a specific booking */
  async fetchByBookingId(bookingId: number) {
    return supabase
      .from("guest_reviews")
      .select("id, approved, created_at")
      .eq("booking_id", bookingId);
  },

  /** Fetch reviews by user ID (with booking details) */
  async fetchByUserId(userId: string) {
    return supabase
      .from("guest_reviews")
      .select(
        "booking_id, approved, rating, resubmission_count, rejection_reason",
      )
      .eq("user_id", userId);
  },

  /** Test connection to guest_reviews table */
  async checkConnection() {
    return supabase.from("guest_reviews").select("count").limit(1);
  },

  /** Create a new review */
  async create(reviewData: TablesInsert<"guest_reviews">) {
    return supabase
      .from("guest_reviews")
      .insert([reviewData])
      .select("*");
  },

  /** Delete a review by ID */
  async deleteById(reviewId: string) {
    return supabase
      .from("guest_reviews")
      .delete()
      .eq("id", reviewId);
  },

  /** Create a review photo */
  async createPhoto(photoData: TablesInsert<"review_photos">) {
    return supabase.from("review_photos").insert(photoData);
  },
};
