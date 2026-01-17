import { Folder } from "@/models/models";

// Helper to check access recursively up the tree
export type AccessLevel = "owner" | "editor" | "viewer" | "none";

export async function checkFolderAccess(folderId: string, userId: string): Promise<AccessLevel> {
    const folder = await Folder.findById(folderId);
    if (!folder) return "none";

    // 1. Owner
    if (folder.ownerId === userId) return "owner";

    // 2. Specific Share (Collaborators)
    if (folder.sharedWith) {
        // Handle migration/legacy: if it was string[], we assume 'viewer' (though typings might complain, we check safely)
        const userShare = folder.sharedWith.find((s: any) => {
            if (typeof s === 'string') return s === userId; // Legacy support
            return s.userId === userId;
        });

        if (userShare) {
             if (typeof userShare === 'string') return "viewer";
             return userShare.role as AccessLevel;
        }
    }

    // 3. Public Share (isShared = Public Link)
    if (folder.isShared) {
        return "viewer";
    }

    // 3. Recursive Check (Inheritance)
    // If parent exists, we inherit the access level from it.
    if (folder.parentFolderId) {
        return checkFolderAccess(folder.parentFolderId.toString(), userId);
    }

    return "none";
}

export function canEdit(level: AccessLevel): boolean {
    return level === "owner" || level === "editor";
}
