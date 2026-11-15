"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { api, errorMessage } from "@/lib/client";
import { useApp } from "@/components/providers";
import { Button } from "@/components/ui";

export function IngestButton() {
  const { toast } = useApp();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="secondary"
      loading={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const r = await api<{ results: { source: string; added: number; skipped?: string }[] }>("/api/ingest", { method: "POST", body: {} });
          const added = r.results.reduce((n, x) => n + x.added, 0);
          const skipped = r.results.filter((x) => x.skipped === "recently-run").length;
          toast(
            added > 0 ? `Pulled ${added} new project${added === 1 ? "" : "s"} from the web` : skipped ? "Sources were refreshed recently — nothing new yet" : "No new projects right now",
            added > 0 ? "success" : "info",
          );
          router.refresh();
        } catch (e) {
          toast(errorMessage(e), "error");
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? null : <Globe size={15} />} Refresh global ideas
    </Button>
  );
}
