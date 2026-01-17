"use client";

import { useState } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { deleteFolder } from "@/app/actions/delete";
import { useRouter } from "next/navigation";

interface DeleteFolderDialogProps {
  folderId: string;
  folderName: string;
}

export function DeleteFolderDialog({ folderId, folderName }: DeleteFolderDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteFolder(folderId);
      router.push("/"); 
      router.refresh();
    } catch (error) {
      console.error("Failed to delete folder", error);
      alert("Failed to delete folder");
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 rounded-lg transition-colors text-sm font-medium"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-background w-full max-w-sm rounded-xl border border-destructive/20 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6 text-center space-y-4">
                 <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive">
                     <AlertTriangle className="w-6 h-6" />
                 </div>
                 <div className="space-y-2">
                     <h3 className="text-lg font-semibold text-destructive">Delete "{folderName}"?</h3>
                     <p className="text-sm text-muted-foreground">
                         This action cannot be undone. This will permanently delete the folder and <span className="font-bold text-foreground">all {loading ? "..." : ""} photos inside it.</span>
                     </p>
                 </div>
             </div>
             
             <div className="p-4 bg-muted/20 border-t flex gap-3">
                 <button 
                     onClick={() => setIsOpen(false)}
                     disabled={loading}
                     className="flex-1 px-4 py-2 bg-background border hover:bg-muted text-foreground text-sm font-medium rounded-lg transition-colors"
                 >
                     Cancel
                 </button>
                 <button 
                     onClick={handleDelete}
                     disabled={loading}
                     className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                 >
                     {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                     {loading ? "Deleting..." : "Delete"}
                 </button>
             </div>
          </div>
        </div>
      )}
    </>
  );
}
