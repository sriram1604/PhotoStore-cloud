"use server";

import mongooseLib from "mongoose";

import connectToDatabase from "@/lib/db";
import { Folder, IFolder, User } from "@/models/models";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { checkFolderAccess } from "@/lib/folder-utils";

export async function createFolder(name: string, parentFolderId: string | null = null) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  console.log("Creating folder:", name, "Parent:", parentFolderId);

  let isShared = false;
  // Initialize with correct type for new schema
  let sharedWith: { userId: string; role: "viewer" | "editor" }[] = [];

  if (parentFolderId) {
    const parentFolder = await Folder.findById(parentFolderId);
    if (parentFolder) {
      isShared = parentFolder.isShared;
      // Copy the array of objects
      if (parentFolder.sharedWith && Array.isArray(parentFolder.sharedWith)) {
          sharedWith = parentFolder.sharedWith.map((s: any) => {
              // Handle potential legacy strings during migration phase (though unlikely to catch here, good practice)
              if (typeof s === 'string') return { userId: s, role: 'viewer' };
              return { userId: s.userId, role: s.role };
          });
      }
    }
  }

  const folder = await Folder.create({
    name,
    ownerId: userId,
    parentFolderId: parentFolderId ? new mongooseLib.Types.ObjectId(parentFolderId) : undefined,
    isShared,
    sharedWith
  });

  revalidatePath("/");
  if (parentFolderId) revalidatePath(`/folders/${parentFolderId}`);
  return JSON.parse(JSON.stringify(folder));
}

export async function getFolders(parentFolderId: string | null = null) {
  const { userId } = await auth();
  
  if (!userId) {
    return [];
  }

  await connectToDatabase();

  // ROOT VIEW (No parentFolderId)
  if (!parentFolderId) {
      // 1. My owned root folders
      const myRootFolders = await Folder.find({ ownerId: userId, parentFolderId: null }).sort({ createdAt: -1 });

      // 2. Folders shared with me (anywhere in tree)
      // Query uses dot notation for array of objects: "sharedWith.userId"
      // Also supports legacy string arrays if mixed (MongoDB handles this query gracefully usually, but explicit $elemMatch is safer for objects)
      const sharedFolders = await Folder.find({
          "sharedWith.userId": userId
      }).sort({ createdAt: -1 });

      // 3. Perfect File Explorer Logic:
      // Filter out shared folders if we already have access to their parent.
      // We only want to show the "Top-most accessible shared folder".
      const visibleSharedFolders = [];
      
      for (const folder of sharedFolders) {
          if (!folder.parentFolderId) {
              // It's a root folder shared with me. Always show.
              visibleSharedFolders.push(folder);
              continue;
          }

          // Check if we have access to the parent
          // If we DO have access to parent (Owner, Editor, Viewer), then the parent (or its parent)
          // will eventually appear in our view (or acts as the entry point).
          // So we hide this child to avoid duplicates/clutter.
          const parentAccess = await checkFolderAccess(folder.parentFolderId.toString(), userId);
          
          if (parentAccess === 'none') {
              // Parent is NOT accessible, so this is an entry point. Show it.
              visibleSharedFolders.push(folder);
          }
          // Else: Parent IS accessible. So this folder will be visible when navigating *into* the parent.
          // Do not show it at root.
      }

      const allFolders = [...myRootFolders, ...visibleSharedFolders];
      // Sort combined result by date
      allFolders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return JSON.parse(JSON.stringify(allFolders));
  }

  // SUBFOLDER VIEW
  const parentFolder = await Folder.findById(parentFolderId);
  if (!parentFolder) return [];

  // Check access to the PARENT folder
  const accessLevel = await checkFolderAccess(parentFolderId, userId);
  if (accessLevel !== "none") {
      return JSON.parse(JSON.stringify(await Folder.find({ parentFolderId }).sort({ createdAt: -1 })));
  }
  
  return [];
}


export async function getFolderById(folderId: string) {
    const { userId } = await auth();
    await connectToDatabase();
    
    const folder = await Folder.findById(folderId);
    if (!folder) return null;

    const accessLevel = await checkFolderAccess(folderId, userId || "");

    if (accessLevel === "none") {
        throw new Error("Unauthorized access to folder");
    }

    const folderObj = JSON.parse(JSON.stringify(folder));
    if (!folderObj.sharedWith) folderObj.sharedWith = [];
    
    // Add access level for UI
    folderObj.accessLevel = accessLevel;

    // Fetch Owner Name
    const owner = await User.findOne({ clerkId: folder.ownerId });
    folderObj.ownerName = owner ? owner.username || owner.email : "Unknown User";

    return folderObj;
}

export async function getBreadcrumbs(folderId: string) {
    await connectToDatabase();
    const crumbs = [];
    let currentId: string | undefined = folderId;

    while (currentId) {
        const folder = await Folder.findById(currentId);
        if (!folder) break;
        crumbs.unshift({ id: folder._id.toString(), name: folder.name });
        currentId = folder.parentFolderId ? folder.parentFolderId.toString() : undefined;
    }
    
    return crumbs;
}
            