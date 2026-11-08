import JSZip from "jszip";

import { supabase } from "@/integrations/supabase/client";

type ExportRow = {
  id: string;
  title: string;
  location: string;
  price: number;
  beds: number;
  baths: number;
  area_sqft: number;
  tag: string | null;
  cover_image: string;
  gallery: string[] | null;
  description: string;
  amenities: string[] | null;
  published: boolean;
  listing_type: string;
  property_type: string;
  placements: string[] | null;
  featured: boolean;
  external_source: string | null;
  external_id: string | null;
  external_url: string | null;
  sync_payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type ExportProgress = { done: number; total: number; label: string };

const COLUMNS =
  "id,title,location,price,beds,baths,area_sqft,tag,cover_image,gallery,description,amenities,published,listing_type,property_type,placements,featured,external_source,external_id,external_url,sync_payload,created_at,updated_at";

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "listing"
  );
}

function csvCell(value: unknown) {
  const text = Array.isArray(value) ? value.join(" | ") : String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function extensionFor(url: string, contentType: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  const match = url.split("?")[0].match(/\.(jpe?g|png|webp|gif)$/i);
  return match ? match[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}

async function fetchImage(url: string) {
  // Prefer the original (no watermark query); fall back to the stored URL.
  const candidates = url.includes("?") ? [url.split("?")[0], url] : [url];
  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate);
      if (!response.ok) continue;
      const blob = await response.blob();
      if (!blob.size) continue;
      return { blob, ext: extensionFor(candidate, blob.type) };
    } catch {
      // try the next candidate
    }
  }
  return null;
}

async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
) {
  let index = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index++];
      await worker(current);
    }
  });
  await Promise.all(runners);
}

/**
 * Builds a ZIP with every property (drafts included): listings.json,
 * listings.csv and one folder per listing holding its photos and details.
 * Must be called by a signed-in admin so unpublished rows are readable.
 */
export async function exportListingsZip(
  onProgress?: (progress: ExportProgress) => void,
) {
  const { data, error } = await supabase
    .from("properties")
    .select(COLUMNS)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const rows = (data ?? []) as ExportRow[];
  const zip = new JSZip();

  const jobs: { folder: string; name: string; url: string }[] = [];
  const failed: string[] = [];

  const manifest = rows.map((row, i) => {
    const folder = `listings/${String(i + 1).padStart(3, "0")}-${slugify(
      row.external_id || row.title,
    )}`;
    const urls = [row.cover_image, ...(row.gallery ?? [])].filter(
      (u, idx, all) => u && /^https?:\/\//.test(u) && all.indexOf(u) === idx,
    );
    urls.forEach((url, n) =>
      jobs.push({
        folder,
        name: n === 0 ? "cover" : `photo-${String(n).padStart(2, "0")}`,
        url,
      }),
    );
    zip.file(
      `${folder}/details.txt`,
      [
        row.title,
        `${row.listing_type.toUpperCase()} - AED ${row.price.toLocaleString()}`,
        `Location: ${row.location}`,
        `Beds: ${row.beds}  Baths: ${row.baths}  Area: ${row.area_sqft} sqft`,
        `Type: ${row.property_type}  Published: ${row.published ? "yes" : "no"}`,
        `Source: ${row.external_source ?? "-"} ${row.external_id ?? ""}`,
        `Amenities: ${(row.amenities ?? []).join(", ")}`,
        "",
        row.description,
      ].join("\n"),
    );
    return { ...row, folder, image_urls: urls };
  });

  zip.file("listings.json", JSON.stringify(manifest, null, 2));

  const header = [
    "folder",
    "title",
    "listing_type",
    "property_type",
    "price_aed",
    "beds",
    "baths",
    "area_sqft",
    "location",
    "published",
    "external_source",
    "external_id",
    "amenities",
    "image_urls",
    "description",
  ];
  const csv = [
    header.join(","),
    ...manifest.map((row) =>
      [
        row.folder,
        row.title,
        row.listing_type,
        row.property_type,
        row.price,
        row.beds,
        row.baths,
        row.area_sqft,
        row.location,
        row.published,
        row.external_source,
        row.external_id,
        row.amenities ?? [],
        row.image_urls,
        row.description,
      ]
        .map(csvCell)
        .join(","),
    ),
  ].join("\r\n");
  zip.file("listings.csv", "﻿" + csv);

  let done = 0;
  const report = (label: string) =>
    onProgress?.({ done, total: jobs.length, label });
  report("Starting photo download");

  await mapWithConcurrency(jobs, 6, async (job) => {
    const image = await fetchImage(job.url);
    if (image) {
      zip.file(`${job.folder}/${job.name}.${image.ext}`, image.blob);
    } else {
      failed.push(job.url);
    }
    done += 1;
    report(job.folder);
  });

  if (failed.length) {
    zip.file("failed-images.txt", failed.join("\n"));
  }

  onProgress?.({ done: jobs.length, total: jobs.length, label: "Zipping" });
  const blob = await zip.generateAsync({ type: "blob" });
  return {
    blob,
    listings: rows.length,
    images: jobs.length - failed.length,
    failed: failed.length,
  };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
