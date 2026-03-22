import { Tables } from "@/database.types";

/** Base review type from Supabase (auto-generated) */
export type GuestReviewRow = Tables<"guest_reviews">;

/** Review photo type from Supabase (auto-generated) */
export type ReviewPhotoRow = Tables<"review_photos">;

/** Review with associated photos */
export interface ReviewWithPhotos extends GuestReviewRow {
  review_photos?: ReviewPhotoRow[];
}

/** Gallery image type from Supabase (auto-generated) */
export type GalleryImage = Tables<"gallery_images">;

/** Maintenance settings from Supabase */
export type MaintenanceSettings = Tables<"maintenance_settings">;
