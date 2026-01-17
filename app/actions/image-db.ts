"use server";

import mongooseLib from "mongoose";

import connectToDatabase from "@/lib/db";
import { ImageModel, User, Folder } from "@/models/models";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { checkFolderAccess } from "@/lib/folder-utils";

export async function saveImageToDb(
  imageData: {
    publicId: string;
    secureUrl: string;
    format: string;
    width: number;
    height: number;
  },
  folderId: string | null = null
) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await connectToDatabase();

  // 1. Ensure User exists in our DB
  let dbUser = await User.findOne({ clerkId: user.id });
  if (!dbUser) {
    dbUser = await User.create({
      clerkId: user.id,
      email: user.emailAddresses[0].emailAddress,
      username: user.firstName ? `${user.firstName} ${user.lastName}` : "User",
    });
  }

  // Check Permissions if saving to a folder
  if (folderId) {
      const accessLevel = await checkFolderAccess(folderId, user.id);
      if (accessLevel !== "owner" && accessLevel !== "editor") {
          throw new Error("You do not have permission to upload to this folder.");
      }
  }

  // 2. Save Image
  console.log("Saving image to DB. FolderID:", folderId);
  const newImage = await ImageModel.create({
    ...imageData,
    ownerId: user.id,
    folderId: folderId ? new mongooseLib.Types.ObjectId(folderId) : undefined,
  });

  revalidatePath("/");
  if (folderId) revalidatePath(`/folders/${folderId}`);
  
  return JSON.parse(JSON.stringify(newImage));
}

export async function getImages(folderId: string | null = null) {
  const { userId } = await auth();
  await connectToDatabase();

  if (folderId) {
    const hasAccess = await checkFolderAccess(folderId, userId || "");
    if (hasAccess) {
       const images = await ImageModel.find({ folderId }).sort({ createdAt: -1 });
       return JSON.parse(JSON.stringify(images));
    }
  }

  // Fallback: User Root
  if (!userId) return [];

  const images = await ImageModel.find({
    ownerId: userId,
    folderId: folderId || null,
  }).sort({ createdAt: -1 });

  return JSON.parse(JSON.stringify(images));
}
