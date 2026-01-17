"use server";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function getSignature() {
  const timestamp = Math.round(new Date().getTime() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: "next-photo-app", // Optional: organize uploads
    },
    process.env.CLOUDINARY_API_SECRET!
  );

  return { timestamp, signature, apiKey: process.env.CLOUDINARY_API_KEY };
}

export async function getImages() {
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    console.error("❌ MISSING CLOUD NAME: Please add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to .env.local");
    return [];
  }

  try {
    const results = await cloudinary.search
      .expression("folder:next-photo-app")
      .sort_by("created_at", "desc")
      .max_results(30)
      .execute();

    return results.resources;
  } catch (error) {
    console.error("Error fetching images:", error);
    return [];
  }
}

export async function saveToDatabase(publicId: string, secureUrl: string) {
    // In a real app we would save this to a DB (Prisma/Drizzle/Convex)
    // For now, we will just rely on fetching from Cloudinary directly
    // or we could Mock it.
    // But the user didn't ask for a DB, just "store in Cloudinary and display".
    // So we can fetch resources from Cloudinary Admin API in the gallery.
    return { success: true };
}
