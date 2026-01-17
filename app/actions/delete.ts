"use server";

import connectToDatabase from "@/lib/db";
import { Folder, ImageModel } from "@/models/models";
import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import { revalidatePath } from "next/cache";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function deleteImage(imageId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const image = await ImageModel.findById(imageId);
  if (!image) throw new Error("Image not found");

  let canDelete = false;
  
  // 1. Owner check
  if (image.ownerId === userId) {
      canDelete = true;
  } 
  // 2. Collaborator check
  else if (image.folderId) {
      const folder = await Folder.findById(image.folderId);
      if (folder && folder.sharedWith && folder.sharedWith.includes(userId)) {
          canDelete = true;
      }
  }

  if (!canDelete) throw new Error("Unauthorized");

  // Delete from Cloudinary
  try {
      await cloudinary.uploader.destroy(image.publicId);
  } catch (error) {
      console.error("Cloudinary delete error:", error);
      // We continue to delete from DB even if Cloudinary fails, 
      // though ideally we'd handle this more robustly (e.g. queue)
  }

  // Delete from DB
  await ImageModel.findByIdAndDelete(imageId);

  revalidatePath("/");
  if(image.folderId) revalidatePath(`/folders/${image.folderId}`);
  
  return { success: true };
}

export async function deleteFolder(folderId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const folder = await Folder.findOne({ _id: folderId, ownerId: userId });
  if (!folder) throw new Error("Folder not found");

  // Recursive delete helper
  async function recursiveDelete(currentFolderId: string) {
    // 1. Find all subfolders
    const subfolders = await Folder.find({ parentFolderId: currentFolderId });
    
    // 2. Recursively delete subfolders
    for (const subfolder of subfolders) {
      await recursiveDelete(subfolder._id.toString());
    }

    // 3. Find and delete all images in this folder
    const images = await ImageModel.find({ folderId: currentFolderId });
    for (const image of images) {
        // Delete from Cloudinary
       try {
           await cloudinary.uploader.destroy(image.publicId);
       } catch (e) {
           console.error(`Failed to delete image ${image.publicId} from Cloudinary`, e);
       }
       // Delete from DB
       await ImageModel.findByIdAndDelete(image._id);
    }

    // 4. Delete the folder itself
    await Folder.findByIdAndDelete(currentFolderId);
  }

  await recursiveDelete(folderId);

  revalidatePath("/");
  if(folder.parentFolderId) revalidatePath(`/folders/${folder.parentFolderId}`);

  return { success: true };
}
