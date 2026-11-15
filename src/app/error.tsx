"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto max-w-lg pt-10">
      <EmptyState
        icon={<AlertTriangle size={20} />}
        title="Something broke on this page"
        description="Your data is safe. Try again, and if it keeps happening, reload the app."
        action={<Button onClick={reset}>Try again</Button>}
      />
    </div>
  );
}
