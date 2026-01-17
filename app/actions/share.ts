"use server";

import connectToDatabase from "@/lib/db";
import { Folder } from "@/models/models";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function toggleFolderShare(folderId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const folder = await Folder.findOne({ _id: folderId, ownerId: userId });
  if (!folder) throw new Error("Folder not found or you don't have permission");

  folder.isShared = !folder.isShared;
  await folder.save();

  revalidatePath(`/folders/${folderId}`);
  return { success: true, isShared: folder.isShared };
}

export async function addCollaborator(folderId: string, collaboratorId: string, role: "viewer" | "editor" = "viewer") {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await connectToDatabase();

    console.log("Adding collaborator:", collaboratorId, "Role:", role);

    // Remove existing if any (to update role)
    await Folder.updateOne(
        { _id: folderId, ownerId: userId },
        { $pull: { sharedWith: { userId: collaboratorId } } }
    );

    // Add new entry
    const result = await Folder.updateOne(
        { _id: folderId, ownerId: userId },
        { $addToSet: { sharedWith: { userId: collaboratorId, role } } }
    );

    console.log("Result:", result);

    if (result.matchedCount === 0) {
        throw new Error("Folder not found or you don't have permission");
    }

    console.log("Collaborator added successfully");
    

    revalidatePath(`/folders/${folderId}`);
    return { success: true };
}

export async function removeCollaborator(folderId: string, collaboratorId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await connectToDatabase();

    // Remove from array of objects where userId matches
    const result = await Folder.updateOne(
        { _id: folderId, ownerId: userId },
        { $pull: { sharedWith: { userId: collaboratorId } } }
    );

    if (result.matchedCount === 0) {
        throw new Error("Folder not found or you don't have permission");
    }

    revalidatePath(`/folders/${folderId}`);
    return { success: true };
}
