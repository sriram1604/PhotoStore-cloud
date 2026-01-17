import ImageGrid from "@/components/ImageGrid";
import FolderGrid from "@/components/FolderGrid";
import CreateFolderDialog from "@/components/CreateFolderDialog";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getImages } from "@/app/actions/image-db";
import { getFolders, getFolderById, getBreadcrumbs } from "@/app/actions/folders";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ShareFolderDialog } from "@/components/ShareFolderDialog";
import { DeleteFolderDialog } from "@/components/DeleteFolderDialog";
import { syncUser } from "@/app/actions/user-sync";

export const dynamic = "force-dynamic";

interface FolderPageProps {
  params: Promise<{
    folderId: string;
  }>;
}

export default async function FolderPage({ params }: FolderPageProps) {
  const { folderId } = await params;
  const { userId } = await auth();
  
  // Parallel data fetching
  const [folder, images, folders, breadcrumbs] = await Promise.all([
    getFolderById(folderId),
    getImages(folderId),
    getFolders(folderId),
    getBreadcrumbs(folderId),
    syncUser()
  ]).catch(() => [null, [], [], [], null] as [any, any, any, any, any]); // Simplified cast

  if (!folder) {
    notFound();
  }

  // Check Permissions
  const isOwner = folder.accessLevel === "owner";
  const canEdit = folder.accessLevel === "owner" || folder.accessLevel === "editor";
   
  return (
    <div className="space-y-8 py-8">
      <div className="space-y-2">
         <Breadcrumbs items={breadcrumbs} />
         
         {/* Folder Header with Admin Name */}
         <div className="flex flex-col gap-1">
             <div className="flex items-baseline justify-between">
                <h1 className="text-3xl font-bold tracking-tight">
                   {folder.name}
                </h1>
                <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full">
                    Admin: {folder.ownerName}
                </span>
             </div>
         </div>

         <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-4">
            <div className="flex gap-2 ml-auto">
                {/* OWNER ONLY ACTIONS */}
                {isOwner && (
                  <>
                    <ShareFolderDialog 
                        folderId={folder._id} 
                        initialIsShared={folder.isShared} 
                        initialSharedWith={folder.sharedWith}
                    />
                    <DeleteFolderDialog folderId={folder._id} folderName={folder.name} />
                  </>
                )}

                {/* EDITOR & OWNER ACTIONS */}
                {canEdit && (
                  <>
                    <CreateFolderDialog parentId={folderId} />
                    {/* Upload Here Button */}
                    <a  
                        href={`/upload?folderId=${folderId}`}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                        Upload Here
                    </a>
                  </>
                )}
            </div>
         </div>
      </div>

      {/* Sub-Folders Section */}
      {folders.length > 0 && (
          <section>
              <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Folders</h2>
              <FolderGrid folders={folders} />
          </section>
      )}

      {/* Images Section */}
      <section>
          {(images.length > 0 || folders.length > 0) && <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Images</h2>}
          <ImageGrid images={images} key={folderId} canDelete={canEdit} />
      </section>
      
      {images.length === 0 && folders.length === 0 && (
          <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-muted-foreground/20">
              <p>This folder is empty.</p>
          </div>
      )}
    </div>
  );
}
