"use client";

import { useState } from "react";
import { Plus, FolderPlus, Loader2 } from "lucide-react";
import { createFolder } from "@/app/actions/folders";
import { useRouter } from "next/navigation";

export default function CreateFolderDialog({ parentId }: { parentId: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    try {
        await createFolder(name, parentId);
        setIsOpen(false);
        setName("");
        router.refresh();
    } catch (error) {
        alert("Failed to create folder");
    } finally {
        setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
      >
        <FolderPlus className="w-4 h-4" />
        New Folder
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background w-full max-w-sm rounded-xl border shadow-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">Create New Folder</h3>
            <form onSubmit={handleCreate} className="space-y-4">
                <input 
                    type="text"
                    placeholder="Folder Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                    autoFocus
                />
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !name}
                        className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-all flex items-center gap-2"
                    >
                        {loading && <Loader2 className="w-3 h-3 animate-spin"/>}
                        Create
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
