import UploadForm from "@/components/UploadForm";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function UploadPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-10">
      <div className="text-center mb-10 space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Upload Photos</h1>
        <p className="text-muted-foreground text-lg">
          Share your memories safely. Compress & Upload.
        </p>
      </div>
      <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin" /></div>}>
        <UploadForm />
      </Suspense>
    </div>
  );
}
