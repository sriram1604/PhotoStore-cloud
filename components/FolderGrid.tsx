"use client";

import Link from "next/link";
import { Folder as FolderIcon } from "lucide-react";
import { IFolder } from "@/models/models";

export default function FolderGrid({ folders }: { folders: IFolder[] }) {
  if (!folders || folders.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
      {folders.map((folder) => (
        <Link
          key={folder._id as unknown as string}
          href={`/folders/${folder._id as unknown as string}`}
          className="group relative flex flex-col items-center justify-center p-6 bg-muted/50 rounded-xl border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all duration-300"
        >
          <FolderIcon className="w-12 h-12 text-blue-500/80 group-hover:text-blue-600 transition-colors mb-2 fill-current" />
          <span className="text-sm font-medium text-center truncate w-full px-2">
            {folder.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
