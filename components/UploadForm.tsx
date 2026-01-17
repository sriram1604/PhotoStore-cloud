"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";
import { Loader2, UploadCloud, X } from "lucide-react";
import { getSignature } from "@/app/actions/cloudinary";
import { saveImageToDb } from "@/app/actions/image-db";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

export default function UploadForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderId = searchParams.get("folderId");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      const totalFiles = files.length;
      let completedFiles = 0;

      for (const file of files) {
        // 1. Compress Image
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });

        // 2. Get Signature
        const { timestamp, signature, apiKey } = await getSignature();

        // 3. Upload to Cloudinary
        const formData = new FormData();
        formData.append("file", compressedFile);
        formData.append("api_key", apiKey!); 
        formData.append("timestamp", timestamp.toString());
        formData.append("signature", signature);
        formData.append("folder", "next-photo-app");

        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

        if (!cloudName) {
            alert("Missing Cloud Name in configuration!");
            throw new Error("Missing Cloud Name");
        }

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }

        const data = await response.json();

        // 4. Save Metadata to DB
        await saveImageToDb({
            publicId: data.public_id,
            secureUrl: data.secure_url,
            format: data.format,
            width: data.width,
            height: data.height,
        }, folderId);

        completedFiles++;
        setProgress((completedFiles / totalFiles) * 100);
      }
      
      // All done
      if (folderId) {
          router.push(`/folders/${folderId}`);
      } else {
          router.push("/");
      }
      router.refresh(); 
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed. See console for details.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300",
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <input {...getInputProps()} />
        <div className="bg-muted p-4 rounded-full mb-4">
          <UploadCloud className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium text-center">
          {isDragActive ? "Drop the files here..." : "Drag & drop files here, or click to select"}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Supports JPG, PNG, WEBP (Max 10MB)
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Selected Files ({files.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {files.map((file, index) => (
              <div key={index} className="relative group rounded-lg overflow-hidden border border-border aspect-square bg-muted">
                <Image
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  fill
                  className="object-cover"
                  onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className={cn(
                "flex-1 bg-primary text-primary-foreground py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2",
                uploading && "opacity-80 cursor-not-allowed"
              )}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading... {Math.round(progress)}%
                </>
              ) : (
                "Upload Files"
              )}
            </button>
             <button
              onClick={() => setFiles([])}
              disabled={uploading}
              className="py-2.5 px-4 rounded-lg font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
                Clear All
            </button>
          </div>
          
            {uploading && (
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div 
                        className="bg-primary h-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
      )}
    </div>
  );
}
