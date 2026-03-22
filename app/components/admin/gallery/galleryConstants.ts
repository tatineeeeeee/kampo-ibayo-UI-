import { Tables } from "../../../../database.types";

export type GalleryImage = Tables<"gallery_images">;

export const categoryOptions = [
  { value: "general", label: "General" },
  { value: "camping", label: "Camping Grounds" },
  { value: "rooms", label: "Family Rooms" },
  { value: "pool", label: "Pool Area" },
  { value: "pets", label: "Pet Area" },
  { value: "dining", label: "Dining & Kitchen" },
  { value: "events", label: "Events & Activities" },
  { value: "nature", label: "Nature & Scenery" },
];

export const categoryLabelMap: Record<string, string> = Object.fromEntries(
  categoryOptions.map((c) => [c.value, c.label])
);

export function cleanDisplayName(image: GalleryImage): string {
  return (
    image.caption ||
    image.alt_text ||
    (image.file_name
      ? image.file_name
          .replace(/\.[^/.]+$/, "")
          .replace(/-/g, " ")
          .replace(/_/g, " ")
      : "Gallery Image")
  );
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
