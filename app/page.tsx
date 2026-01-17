import ImageGrid from "@/components/ImageGrid";
import FolderGrid from "@/components/FolderGrid";
import CreateFolderDialog from "@/components/CreateFolderDialog";
import { getImages } from "@/app/actions/image-db";
import { getFolders } from "@/app/actions/folders";

import { syncUser } from "@/app/actions/user-sync";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [images, folders] = await Promise.all([
    getImages(null), // Null for root
    getFolders(null), // Null for root
    syncUser() // Ensure user exists
  ]);

  return (
    <div className="space-y-8 py-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              My Files
            </h1>
            <p className="text-muted-foreground mt-1">
                Manage your photos and folders
            </p>
          </div>
          <CreateFolderDialog parentId={null} />
      </section>

      {/* Folders Section */}
      {folders.length > 0 && (
          <section>
              <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Folders</h2>
              <FolderGrid folders={folders} />
          </section>
      )}

      {/* Images Section */}
      <section>
          {images.length > 0 && <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Images</h2>}
          <ImageGrid images={images} canDelete={true} />
      </section>
      
      {images.length === 0 && folders.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
              No files or folders yet. Create one or upload!
          </div>
      )}
    </div>
  );
}
