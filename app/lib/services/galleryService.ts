import { supabase } from "../../supabaseClient";
import { TablesInsert, TablesUpdate } from "@/database.types";

/**
 * Gallery Service - Wraps all client-side Supabase queries for the gallery_images table.
 * Queries are unchanged from their original inline usage; only relocated here.
 */
export const galleryService = {
  /** Fetch all gallery images ordered by creation date */
  async fetchAll() {
    return supabase
      .from("gallery_images")
      .select("*")
      .order("created_at", { ascending: false });
  },

  /** Fetch featured gallery images */
  async fetchFeatured() {
    return supabase
      .from("gallery_images")
      .select("*")
      .eq("is_featured", true);
  },

  /** Count images in a category */
  async countByCategory(category: string) {
    return supabase
      .from("gallery_images")
      .select("*", { count: "exact", head: true })
      .eq("category", category);
  },

  /** Create a gallery image record */
  async create(imageData: TablesInsert<"gallery_images">) {
    return supabase.from("gallery_images").insert(imageData);
  },

  /** Update a gallery image by ID */
  async updateById(imageId: number, updateData: TablesUpdate<"gallery_images">) {
    return supabase
      .from("gallery_images")
      .update(updateData)
      .eq("id", imageId);
  },

  /** Update multiple gallery images by IDs */
  async updateByIds(ids: number[], updateData: TablesUpdate<"gallery_images">) {
    return supabase
      .from("gallery_images")
      .update(updateData)
      .in("id", ids);
  },

  /** Delete a gallery image by ID */
  async deleteById(imageId: number) {
    return supabase
      .from("gallery_images")
      .delete()
      .eq("id", imageId);
  },

  /** Delete all gallery images */
  async deleteAll() {
    return supabase
      .from("gallery_images")
      .delete()
      .neq("id", 0);
  },

  /** Delete multiple gallery images by IDs */
  async deleteByIds(ids: number[]) {
    return supabase
      .from("gallery_images")
      .delete()
      .in("id", ids);
  },

  /** Toggle featured status for an image */
  async toggleFeatured(imageId: number, currentFeatured: boolean) {
    return supabase
      .from("gallery_images")
      .update({ is_featured: !currentFeatured })
      .eq("id", imageId);
  },
};
