"use client";

import Image from "next/image";
import { Download, Cloud, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteImage } from "@/app/actions/delete";

interface CloudinaryResource {
  publicId: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  _id: string;
}

export default function ImageGrid({ images, canDelete = false }: { images: CloudinaryResource[], canDelete?: boolean }) {
  const validImages = images.filter((img) => img.secureUrl);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (imageId: string) => {
      if (!confirm("Are you sure you want to delete this image?")) return;

      setDeletingId(imageId);
      try {
          await deleteImage(imageId);
          router.refresh();
      } catch (error) {
          console.error("Failed to delete image", error);
          alert("Failed to delete image");
      } finally {
          setDeletingId(null);
      }
  };

  if (!validImages || validImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <div className="bg-muted p-6 rounded-full">
            <Cloud className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-medium">No images yet</h3>
        <p className="text-muted-foreground">Upload your first photo to get started!</p>
      </div>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 pb-20">
      {validImages.map((image) => (
        <div
          key={image.publicId}
          className="relative break-inside-avoid group rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-muted"
        >
          <Image
            src={image.secureUrl}
            alt={image.publicId || ""}
            width={image.width}
            height={image.height}
            className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          
          <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
             <a
                href={image.secureUrl}
                target="_blank"
                download
                className="p-2 bg-white/90 rounded-full hover:bg-white text-black transition-colors shadow-sm block"
                title="Download"
             >
                <Download className="w-4 h-4" />
             </a>
             {canDelete && (
                 <button
                    onClick={(e) => {
                        e.preventDefault();
                        handleDelete(image._id);
                    }}
                    disabled={deletingId === image._id}
                    className="p-2 bg-white/90 rounded-full hover:bg-destructive hover:text-white text-destructive transition-colors shadow-sm block"
                    title="Delete"
                 >
                    {deletingId === image._id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />}
                 </button>
             )}
          </div>
        </div>
      ))}
    </div>
  );
}
